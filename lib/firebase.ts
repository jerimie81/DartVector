// Firebase SDK Initialization
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, browserLocalPersistence, setPersistence, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
};

const requiredFirebaseKeys = ['apiKey', 'authDomain', 'projectId', 'appId'] as const;
const firebaseReady = requiredFirebaseKeys.every((key) => Boolean(firebaseConfig[key]));

let app: FirebaseApp | null = null;
export let auth: Auth | null = null;
export let db: Firestore | null = null;
export let googleProvider: GoogleAuthProvider | null = null;

if (firebaseReady) {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

  auth = getAuth(app);

  // Use the specific firestoreDatabaseId from the config or fallback to default
  db = getFirestore(
    app,
    process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID || '(default)'
  );

  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    prompt: 'select_account',
  });

  // Configure auth persistence
  if (typeof window !== 'undefined') {
    setPersistence(auth, browserLocalPersistence).catch(() => {
      // ignore
    });
  }
}

export { firebaseReady };
