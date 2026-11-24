import { User, ServiceResponse, Order } from '@/types';
import { signInWithEmailAndPassword, sendPasswordResetEmail, signOut, reauthenticateWithCredential, EmailAuthProvider, updatePassword, updateProfile as fbUpdateProfile } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebaseClient';
import { doc, updateDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { orderService } from './orderService';

const AUTH_KEY = 'handatala_auth';
const ADMIN_KEY = 'handatala_admin';
const API_URL = 'http://localhost:5000/api/auth';


export const authService = {
  async signup(name: string, email: string, password: string): Promise<ServiceResponse<User>> {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();

    if (!normalizedName) {
      return {
        success: false,
        data: null,
        error: { code: 'INVALID_NAME', message: 'Name is required' },
      };
    }

    if (password.length < 6) {
      return {
        success: false,
        data: null,
        error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 6 characters' },
      };
    }

    try {
      const response = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: normalizedName, email: normalizedEmail, password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return {
          success: false,
          data: null,
          error: { code: 'SIGNUP_FAILED', message: result.error?.message || 'Unable to create account' },
        };
      }

      const { user, token } = result.data;
      const authData = { user, token, isAuthenticated: true, isAdmin: false };
      localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
      localStorage.removeItem(ADMIN_KEY);

      return { success: true, data: user, error: null };
    } catch {
      return {
        success: false,
        data: null,
        error: { code: 'NETWORK_ERROR', message: 'Could not connect to backend server. Make sure backend is running on port 5000.' },
      };
    }
  },

  async login(email: string, password: string): Promise<ServiceResponse<User>> {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const auth = getFirebaseAuth();
      const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      const idToken = await credential.user.getIdToken();
      const firebaseResponse = await fetch(`${API_URL}/firebase-signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });
      const firebaseResult = await firebaseResponse.json();

      if (!firebaseResponse.ok || !firebaseResult.success) {
        return {
          success: false,
          data: null,
          error: { code: 'INVALID_CREDENTIALS', message: firebaseResult.error?.message || 'Invalid email or password' },
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
      const code = typeof error === 'object' && error !== null && 'code' in error
        ? String(error.code)
        : '';
      if (code.startsWith('auth/')) {
        return {
          success: false,
          data: null,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
        };
      }
      return {
        success: false,
        data: null,
        error: { code: 'NETWORK_ERROR', message: 'Could not connect to backend server. Make sure backend is running on port 5000.' },
      };
    }
  },

  async updateProfile(updates: {
    firstName: string;
    middleName?: string;
    lastName: string;
    name: string;
    phone?: string;
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

    try {
      const auth = getFirebaseAuth();
      const firebaseUser = auth.currentUser;
      const db = getFirestore(auth.app);
      const userRef = doc(db, 'users', currentUser.id);

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

      if (firebaseUser) {
        await fbUpdateProfile(firebaseUser, {
          displayName: updatedUser.name,
          photoURL: updatedUser.photoURL || '',
        }).catch(() => {});
      }

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
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      return {
        success: false,
        data: null,
        error: { code: 'UPDATE_FAILED', message },
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
