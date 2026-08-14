import { initializeApp, getApps } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getDatabase, type Database } from 'firebase/database';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const REQUIRED_CONFIG: { value: string | undefined; label: string }[] = [
  { value: firebaseConfig.apiKey, label: 'Web API Key' },
  { value: firebaseConfig.authDomain, label: 'Auth Domain' },
  { value: firebaseConfig.databaseURL, label: 'Database URL' },
  { value: firebaseConfig.projectId, label: 'Project ID' },
  { value: firebaseConfig.storageBucket, label: 'Storage Bucket' },
  { value: firebaseConfig.messagingSenderId, label: 'Messaging Sender ID' },
  { value: firebaseConfig.appId, label: 'App ID' },
];

export function getFirebaseConfigError(): string | null {
  const missing = REQUIRED_CONFIG
    .filter(({ value }) => !value)
    .map(({ label }) => label);
  return missing.length > 0
    ? `Firebase is missing config: ${missing.join(', ')}. Set the values from the Firebase console in .env locally or in your deployment environment, then rebuild (see SETTING_UP_FIREBASE.md).`
    : null;
}

const existing = getApps();
const app = existing.length > 0 ? existing[0] : initializeApp(firebaseConfig);

let _auth: Auth | null = null;
let _db: Database | null = null;
let _storage: FirebaseStorage | null = null;

try {
  _auth = getAuth(app);
  _db = getDatabase(app);
  _storage = getStorage(app);
} catch {
  _auth = null;
  _db = null;
  _storage = null;
}

export const auth = _auth as Auth;
export const db = _db as Database;
export const storage = _storage as FirebaseStorage;
