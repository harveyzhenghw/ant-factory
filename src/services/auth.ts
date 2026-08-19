import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
  User,
} from 'firebase/auth';
import { ref, get, set, update } from 'firebase/database';
import { auth, db } from './firebase';
import { UserProfile } from '../types';

export async function register(email: string, password: string, username: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: username });

  const profile: UserProfile = {
    id: cred.user.uid,
    username,
    displayName: username,
    email,
    avatarUrl: cred.user.photoURL ?? '',
    honeydew: 100,
    level: 1,
    xp: 0,
    createdAt: Date.now(),
  };

  await set(ref(db, `users/${cred.user.uid}`), profile);
  return profile;
}

export async function login(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const snap = await get(ref(db, `users/${cred.user.uid}`));
  return snap.val() as UserProfile;
}

export async function loginWithGoogle(idToken: string) {
  const credential = GoogleAuthProvider.credential(idToken);
  const cred = await signInWithCredential(auth, credential);

  const snap = await get(ref(db, `users/${cred.user.uid}`));
  if (snap.exists()) {
    return snap.val() as UserProfile;
  }

  const profile: UserProfile = {
    id: cred.user.uid,
    username: cred.user.displayName ?? 'user',
    displayName: cred.user.displayName ?? 'User',
    email: cred.user.email ?? '',
    avatarUrl: cred.user.photoURL ?? '',
    honeydew: 100,
    level: 1,
    xp: 0,
    createdAt: Date.now(),
  };

  await set(ref(db, `users/${cred.user.uid}`), profile);
  return profile;
}

export async function logout() {
  await signOut(auth);
}

export async function getUserProfile(user: User): Promise<UserProfile | null> {
  const snap = await get(ref(db, `users/${user.uid}`));
  return snap.exists() ? (snap.val() as UserProfile) : null;
}

function defaultProfile(user: User): UserProfile {
  const fallbackName = user.email ? user.email.split('@')[0] : 'AntKeeper';
  return {
    id: user.uid,
    username: user.displayName ?? fallbackName,
    displayName: user.displayName ?? fallbackName,
    email: user.email ?? '',
    avatarUrl: user.photoURL ?? '',
    honeydew: 100,
    level: 1,
    xp: 0,
    createdAt: Date.now(),
  };
}

/**
 * Guarantees the signed-in user has a profile record. Reads `users/$uid` and,
 * if it's missing, seeds a default one. This closes the gap where
 * `onAuthStateChanged` fires before register()/loginWithGoogle finish writing
 * the profile, and self-heals any account whose profile write previously failed.
 */
export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const userRef = ref(db, `users/${user.uid}`);
  const snap = await get(userRef);
  if (snap.exists()) return snap.val() as UserProfile;

  const profile = defaultProfile(user);
  await set(userRef, profile);
  return profile;
}

export async function updateUserProfile(userId: string, updates: { username?: string; displayName?: string }) {
  await update(ref(db, `users/${userId}`), updates);
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'That email address looks invalid.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/user-not-found': 'Incorrect email or password.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/account-exists-with-different-credential':
    'This email is already registered with a different sign-in method.',
};

/** Maps a Firebase auth error to a short, user-friendly message. */
export function authErrorMessage(e: unknown): string {
  const code = (e as { code?: string })?.code;
  if (code && AUTH_ERROR_MESSAGES[code]) return AUTH_ERROR_MESSAGES[code];
  const message = (e as { message?: string })?.message;
  return message ?? 'Something went wrong. Please try again.';
}
