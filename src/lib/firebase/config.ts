import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const rawAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const authDomain =
  rawAuthDomain && !rawAuthDomain.includes('cumple-9bcd7.firebaseapp.com')
    ? rawAuthDomain
    : 'autobirthday.vercel.app';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyFakeKeyForBuildValidationOnly12345',
  authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'autobirthday-app',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'autobirthday-app.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789000',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789000:web:abcdef123456',
};


const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
