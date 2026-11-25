import { User, ServiceResponse, Order, SignupInput } from '@/types';
import { signInWithEmailAndPassword, sendPasswordResetEmail, signOut, reauthenticateWithCredential, EmailAuthProvider, updatePassword, updateProfile as fbUpdateProfile } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebaseClient';
import { doc, updateDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { getFirebaseStorage } from '@/lib/firebaseClient';
import { orderService } from './orderService';

const AUTH_KEY = 'handatala_auth';
const ADMIN_KEY = 'handatala_admin';
const NETWORK_FAILURE_MESSAGE = 'Could not connect to the server. Check your connection and try again.';
const INVALID_FIREBASE_CREDENTIAL_CODES = new Set([
  'auth/invalid-credential',
  'auth/wrong-password',
  'auth/user-not-found',
  'auth/invalid-email',
]);

function getErrorCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : '';
}


export const authService = {
  async signup(input: SignupInput): Promise<ServiceResponse<User>> {
    const firstName = input.firstName.trim();
    const middleName = input.middleName?.trim() || '';
    const lastName = input.lastName.trim();
    const normalizedEmail = input.email.trim().toLowerCase();
    const phone = input.phone.trim();
    const normalizedName = [firstName, middleName, lastName].filter(Boolean).join(' ');
    const namePattern = /^[\p{L} .'-]+$/u;
    const phonePattern = /^(09\d{9}|\+639\d{9})$/;

    if (!firstName || !lastName) {
      return {
        success: false,
        data: null,
        error: { code: 'INVALID_NAME', message: 'First name and last name are required' },
      };
    }

    if ([firstName, middleName, lastName].some((value) => value.length > 50 || (value.length > 0 && !namePattern.test(value)))) {
      return {
        success: false,
        data: null,
        error: { code: 'INVALID_NAME', message: 'Names contain invalid characters or are too long' },
      };
    }

    if (!phone) {
      return {
        success: false,
        data: null,
        error: { code: 'INVALID_PHONE', message: 'Mobile number is required' },
      };
    }

    if (!phonePattern.test(phone)) {
      return {
        success: false,
        data: null,
        error: { code: 'INVALID_PHONE', message: 'Use a valid Philippine mobile number' },
      };
    }

    if (input.password.length < 6) {
      return {
        success: false,
        data: null,
        error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 6 characters' },
      };
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          middleName,
          lastName,
          phone,
          name: normalizedName,
          email: normalizedEmail,
          password: input.password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        if (response.status >= 500) {
          console.error('Signup backend error:', {
            status: response.status,
            message: result.error?.message,
          });
          return {
            success: false,
            data: null,
            error: { code: 'SERVER_ERROR', message: NETWORK_FAILURE_MESSAGE },
          };
        }
        return {
          success: false,
          data: null,
          error: { code: 'SIGNUP_FAILED', message: result.error?.message || 'Unable to create account' },
        };
      }

      const { user, token } = result.data;
      try {
        await signInWithEmailAndPassword(getFirebaseAuth(), normalizedEmail, input.password);
      } catch {
        return {
          success: false,
          data: null,
          error: {
            code: 'AUTH_SESSION_FAILED',
            message: 'Account created, but the sign-in session could not be established. Please sign in again.',
          },
        };
      }
      const authData = { user, token, isAuthenticated: true, isAdmin: false };
      localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
      localStorage.removeItem(ADMIN_KEY);

      return { success: true, data: user, error: null };
    } catch (error: unknown) {
      console.error('Signup request failed:', error);
      return {
        success: false,
        data: null,
        error: { code: 'NETWORK_ERROR', message: NETWORK_FAILURE_MESSAGE },
      };
    }
  },

  async login(email: string, password: string): Promise<ServiceResponse<User>> {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const auth = getFirebaseAuth();
      const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      const idToken = await credential.user.getIdToken();
      const firebaseResponse = await fetch('/api/auth/firebase-signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });
      const firebaseResult = await firebaseResponse.json();

      if (!firebaseResponse.ok || !firebaseResult.success) {
        if (firebaseResponse.status >= 500) {
          console.error('Login backend error:', {
            status: firebaseResponse.status,
            message: firebaseResult.error?.message,
          });
          return {
            success: false,
            data: null,
            error: { code: 'SERVER_ERROR', message: NETWORK_FAILURE_MESSAGE },
          };
        }
        return {
          success: false,
          data: null,
          error: {
            code: 'AUTH_VERIFICATION_FAILED',
            message: firebaseResult.error?.message || 'Unable to verify your sign-in with the server.',
          },
        };
      }

      const { user, token } = firebaseResult.data;
      const authData = { user, token, isAuthenticated: true, isAdmin: user.role === 'admin' };
      localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
      if (user.role === 'admin') {
        localStorage.setItem(ADMIN_KEY, 'true');
      } else {
        localStorage.removeItem(ADMIN_KEY);
      }

      return { success: true, data: user, error: null };
    } catch (error: unknown) {
      const code = getErrorCode(error);
      if (INVALID_FIREBASE_CREDENTIAL_CODES.has(code)) {
        return {
          success: false,
          data: null,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
        };
      }
      console.error('Login request failed:', error);
      return {
        success: false,
        data: null,
        error: { code: 'NETWORK_ERROR', message: NETWORK_FAILURE_MESSAGE },
      };
    }
  },

  async updateProfile(updates: {
    firstName: string;
    middleName?: string;
    lastName: string;
    name: string;
    phone: string;
    photoURL?: string;
  }): Promise<ServiceResponse<User>> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        data: null,
        error: { code: 'UNAUTHENTICATED', message: 'Not signed in' },
      };
    }

    const previousProfile = {
      firstName: currentUser.firstName || '',
      middleName: currentUser.middleName || '',
      lastName: currentUser.lastName || '',
      name: currentUser.name,
      phone: currentUser.phone || '',
      photoURL: currentUser.photoURL || '',
      updatedAt: currentUser.updatedAt || '',
    };
    let userRef: ReturnType<typeof doc> | undefined;

    try {
      const auth = getFirebaseAuth();
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        return {
          success: false,
          data: null,
          error: { code: 'UNAUTHENTICATED', message: 'Your Firebase session has expired. Please sign out and sign in again.' },
        };
      }
      const db = getFirestore(auth.app);
      userRef = doc(db, 'users', currentUser.id);

      const updatedAt = new Date().toISOString();
      const updatedUser: User = {
        ...currentUser,
        firstName: updates.firstName,
        middleName: updates.middleName || '',
        lastName: updates.lastName,
        name: updates.name,
        phone: updates.phone !== undefined ? updates.phone : (currentUser.phone || ''),
        photoURL: updates.photoURL !== undefined ? updates.photoURL : (currentUser.photoURL || ''),
        updatedAt,
      };

      await updateDoc(userRef, {
        firstName: updatedUser.firstName,
        middleName: updatedUser.middleName,
        lastName: updatedUser.lastName,
        name: updatedUser.name,
        phone: updatedUser.phone,
        photoURL: updatedUser.photoURL,
        updatedAt,
      });

      await fbUpdateProfile(firebaseUser, {
        displayName: updatedUser.name,
        photoURL: updatedUser.photoURL || '',
      });

      const authDataStr = localStorage.getItem(AUTH_KEY);
      if (authDataStr) {
        try {
          const authData = JSON.parse(authDataStr);
          authData.user = updatedUser;
          localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
        } catch {}
      }

      return { success: true, data: updatedUser, error: null };
    } catch (error: unknown) {
      let rollbackMessage = '';
      try {
        if (userRef) await updateDoc(userRef, previousProfile);
      } catch (rollbackError: unknown) {
        rollbackMessage = rollbackError instanceof Error ? ` Profile rollback failed: ${rollbackError.message}` : ' Profile rollback failed.';
      }
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      return {
        success: false,
        data: null,
        error: { code: 'UPDATE_FAILED', message: `${message}${rollbackMessage}` },
      };
    }
  },

  async uploadProfilePhoto(
    blob: Blob,
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<ServiceResponse<string>> {
    try {
      const storageRef = ref(getFirebaseStorage(), `profile-photos/${userId}/avatar.jpg`);
      const uploadTask = uploadBytesResumable(storageRef, blob, { contentType: 'image/jpeg' });
      const downloadURL = await new Promise<string>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => onProgress?.((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
          reject,
          async () => resolve(await getDownloadURL(uploadTask.snapshot.ref))
        );
      });
      return { success: true, data: downloadURL, error: null };
    } catch (error: unknown) {
      return {
        success: false,
        data: null,
        error: {
          code: 'PHOTO_UPLOAD_FAILED',
          message: error instanceof Error ? error.message : 'Failed to upload profile photo',
        },
      };
    }
  },

  async deleteProfilePhoto(photoURL: string): Promise<ServiceResponse<boolean>> {
    if (!photoURL || !photoURL.includes('firebasestorage.googleapis.com')) {
      return { success: true, data: true, error: null };
    }

    try {
      await deleteObject(ref(getFirebaseStorage(), photoURL));
      return { success: true, data: true, error: null };
    } catch (error: unknown) {
      return {
        success: false,
        data: null,
        error: {
          code: 'PHOTO_DELETE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to delete profile photo',
        },
      };
    }
  },

  async changePassword(currentPass: string, newPass: string): Promise<ServiceResponse<boolean>> {
    try {
      const auth = getFirebaseAuth();
      const firebaseUser = auth.currentUser;
      if (!firebaseUser || !firebaseUser.email) {
        return {
          success: false,
          data: null,
          error: { code: 'UNAUTHENTICATED', message: 'No signed-in user' },
        };
      }

      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPass);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPass);

      return { success: true, data: true, error: null };
    } catch (error: unknown) {
      const code = error instanceof Error && 'code' in error ? String(error.code) : '';
      const errorMessage = error instanceof Error ? error.message : '';
      let message = 'Failed to update password';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        message = 'Incorrect current password.';
      } else if (code === 'auth/requires-recent-login') {
        message = 'Please sign out and sign back in before changing your password.';
      } else if (errorMessage) {
        message = errorMessage;
      }
      return {
        success: false,
        data: null,
        error: { code: code || 'PASSWORD_CHANGE_FAILED', message },
      };
    }
  },

  async getUserOrders(): Promise<ServiceResponse<Order[]>> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return { success: true, data: [], error: null };
    return orderService.getOrdersByCustomerId(currentUser.id);
  },

  async forgotPassword(email: string): Promise<ServiceResponse<string>> {
    const normalizedEmail = email.trim().toLowerCase();
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), normalizedEmail);
      return {
        success: true,
        data: 'If an account exists with this email, password reset instructions have been sent.',
        error: null,
      };
    } catch {
      return {
        success: true,
        data: 'If an account exists with this email, password reset instructions have been sent.',
        error: null,
      };
    }
  },

  async logout(): Promise<ServiceResponse<boolean>> {
    try {
      await signOut(getFirebaseAuth());
    } catch {
      // Local session cleanup should still complete if Firebase sign-out fails.
    }
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(ADMIN_KEY);
    return {
      success: true,
      data: true,
      error: null,
    };
  },

  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    
    const authData = localStorage.getItem(AUTH_KEY);
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        return parsed.user || null;
      } catch {
        return null;
      }
    }
    return null;
  },

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    const authData = localStorage.getItem(AUTH_KEY);
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        return parsed.isAuthenticated === true;
      } catch {
        return false;
      }
    }
    return false;
  },

  isAdmin(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(ADMIN_KEY) === 'true';
  },

  requireAuth(): boolean {
    return this.isAuthenticated();
  },

  requireAdmin(): boolean {
    return this.isAdmin();
  },
};
