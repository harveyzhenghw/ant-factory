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

export async function updateUserProfile(userId: string, updates: { username?: string; displayName?: string }) {
  await update(ref(db, `users/${userId}`), updates);
}
