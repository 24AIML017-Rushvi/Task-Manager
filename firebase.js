import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

/**
 * Firebase Client Configuration
 * Keys are loaded from environment variables (Vite prefix VITE_).
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

/**
 * Check whether required Firebase keys have been configured in .env.
 */
export function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== 'your_firebase_api_key_here' &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== 'your_firebase_project_id_here'
  );
}

// Initialize Firebase App only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

/**
 * Format Firebase Auth error codes into friendly readable messages.
 */
export function formatFirebaseAuthError(error) {
  if (!error) return 'An unexpected error occurred.';
  const code = error.code || '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email address or password. Please verify and try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please log in instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please provide a valid email address.';
    case 'auth/too-many-requests':
      return 'Access temporarily blocked due to multiple failed login attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/configuration-not-found':
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled in Firebase Console. Please enable it under Authentication -> Sign-in method.';
    default:
      return error.message || 'Authentication failed. Please try again.';
  }
}

/**
 * Log in with Email and Password using Firebase.
 */
export async function loginWithEmail(email, password) {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase is not configured yet. Please add your Firebase configuration (VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, etc.) in task-manager-frontend/.env'
    );
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (err) {
    throw new Error(formatFirebaseAuthError(err), { cause: err });
  }
}

/**
 * Register with Name, Email, and Password using Firebase.
 */
export async function registerWithEmail(name, email, password) {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase is not configured yet. Please add your Firebase configuration (VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, etc.) in task-manager-frontend/.env'
    );
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (name && userCredential.user) {
      await updateProfile(userCredential.user, { displayName: name });
    }
    return userCredential.user;
  } catch (err) {
    throw new Error(formatFirebaseAuthError(err), { cause: err });
  }
}

/**
 * Send password reset email via Firebase.
 */
export async function resetPassword(email) {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase is not configured yet. Please add your Firebase configuration in task-manager-frontend/.env'
    );
  }

  try {
    await sendPasswordResetEmail(auth, email);
  } catch (err) {
    throw new Error(formatFirebaseAuthError(err), { cause: err });
  }
}

/**
 * Log out from Firebase.
 */
export async function logoutUser() {
  await signOut(auth);
}

export { onAuthStateChanged, firebaseConfig };
