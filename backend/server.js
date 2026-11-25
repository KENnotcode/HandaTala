const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { getFirebaseAdmin } = require('./firebaseAdmin');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('Missing JWT_SECRET environment variable.');
  process.exit(1);
}

// Signup endpoint
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { firstName, middleName = '', lastName, phone, email, password } = req.body;
    if (!firstName || !lastName || !phone || !email || !password) {
      return res.status(400).json({ success: false, error: { message: 'First name, last name, mobile number, email, and password are required' } });
    }

    const namePattern = /^[\p{L} .'-]+$/u;
    const phonePattern = /^(09\d{9}|\+639\d{9})$/;
    const normalizedFirstName = firstName.trim();
    const normalizedMiddleName = middleName.trim();
    const normalizedLastName = lastName.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();
    const normalizedName = [normalizedFirstName, normalizedMiddleName, normalizedLastName].filter(Boolean).join(' ');

    if ([normalizedFirstName, normalizedMiddleName, normalizedLastName].some((value) => value.length > 50 || (value.length > 0 && !namePattern.test(value)))) {
      return res.status(400).json({ success: false, error: { message: 'Names contain invalid characters or are too long' } });
    }

    if (!normalizedPhone) {
      return res.status(400).json({ success: false, error: { message: 'Mobile number is required' } });
    }

    if (!phonePattern.test(normalizedPhone)) {
      return res.status(400).json({ success: false, error: { message: 'Use a valid Philippine mobile number' } });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: { message: 'Password must be at least 6 characters' } });
    }

    let firebaseAdmin;
    try {
      firebaseAdmin = getFirebaseAdmin();
    } catch (firebaseError) {
      console.error('Firebase signup configuration error:', firebaseError);
      return res.status(503).json({
        success: false,
        error: { message: 'Account service is unavailable. Firebase configuration or connection failed.' },
      });
    }

    let firebaseUser;
    try {
      firebaseUser = await firebaseAdmin.auth.createUser({
        email: normalizedEmail,
        password,
        displayName: normalizedName,
      });
    } catch (firebaseError) {
      if (firebaseError.code === 'auth/email-already-exists') {
        return res.status(400).json({
          success: false,
          error: { message: 'An account with this email already exists' },
        });
      }
      console.error('Firebase signup error:', firebaseError);
      return res.status(503).json({
        success: false,
        error: { message: 'Account service is unavailable. Firebase configuration or connection failed.' },
      });
    }

    const newUser = {
      id: firebaseUser.uid,
      firstName: normalizedFirstName,
      middleName: normalizedMiddleName,
      lastName: normalizedLastName,
      name: normalizedName,
      email: normalizedEmail,
      role: 'customer',
      phone: normalizedPhone,
      photoURL: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await firebaseAdmin.firestore.collection('users').doc(firebaseUser.uid).set({
        ...newUser,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (firestoreError) {
      await firebaseAdmin.auth.deleteUser(firebaseUser.uid).catch(() => {});
      console.error('Firestore signup profile write failed:', firestoreError);
      return res.status(503).json({
        success: false,
        error: { message: 'Account service is unavailable. Please try again.' },
      });
    }

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      data: {
        user: newUser,
        token,
      },
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
});

// Legacy signin endpoint; password verification is handled by the Firebase Client SDK.
app.post('/api/auth/signin', async (req, res) => {
  return res.status(410).json({
    success: false,
    error: { message: 'This signin endpoint is retired. Sign in with Firebase and call /api/auth/firebase-signin with an ID token.' },
  });
});

// Firebase Authentication signin verification
app.post('/api/auth/firebase-signin', async (req, res) => {
  try {
    const authorization = req.headers.authorization || '';
    const idToken = authorization.startsWith('Bearer ')
      ? authorization.slice(7)
      : '';

    if (!idToken) {
      return res.status(401).json({
        success: false,
        error: { message: 'Firebase authentication token is required' },
      });
    }

    const firebaseAdmin = getFirebaseAdmin();
    const decodedToken = await firebaseAdmin.auth.verifyIdToken(idToken);
    const firebaseUser = await firebaseAdmin.auth.getUser(decodedToken.uid);
    const userDocument = await firebaseAdmin.firestore.collection('users').doc(firebaseUser.uid).get();

    const profile = userDocument.exists
      ? userDocument.data()
      : {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Customer',
          email: firebaseUser.email,
          role: 'customer',
        };

    const firestoreRole = typeof profile.role === 'string' ? profile.role : 'customer';
    const user = {
      id: firebaseUser.uid,
      firstName: profile.firstName || '',
      middleName: profile.middleName || '',
      lastName: profile.lastName || '',
      name: profile.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Customer',
      email: firebaseUser.email || profile.email,
      role: firestoreRole === 'admin' || firestoreRole === 'kitchen' ? firestoreRole : 'customer',
      phone: profile.phone || '',
      photoURL: profile.photoURL || firebaseUser.photoURL || '',
      createdAt: profile.createdAt || new Date().toISOString(),
      updatedAt: profile.updatedAt || new Date().toISOString(),
    };

    if (!userDocument.exists) {
      await firebaseAdmin.firestore.collection('users').doc(firebaseUser.uid).set({
        ...user,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      data: { user, token },
    });
  } catch (error) {
    console.error('Firebase signin verification error:', error);
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid Firebase authentication credentials' },
    });
  }
});

// Forgot Password endpoint
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: { message: 'Email is required' } });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const genericMessage = 'If an account exists with this email, password reset instructions have been sent.';

  try {
    const firebaseAdmin = getFirebaseAdmin();
    await firebaseAdmin.auth.generatePasswordResetLink(normalizedEmail);
  } catch (error) {
    // Intentionally ignore Firebase errors so the response does not reveal account existence.
  }

  return res.json({
    success: true,
    message: genericMessage,
  });
});

app.listen(PORT, () => {
  console.log(`HandaTala backend server running on port ${PORT}`);
});
