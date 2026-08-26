import { initializeApp, getApps, cert, getApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let _adminApp: App | null = null;
let _adminAuth: Auth | null = null;
let _adminDb: Firestore | null = null;

export function getAdminApp(): App {
  if (_adminApp) return _adminApp;
  if (getApps().length > 0) {
    _adminApp = getApp();
    return _adminApp;
  }

  let credential;

  // 1. Check for JSON service account key
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      credential = cert(serviceAccount);
    } catch (error) {
      console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY', error);
    }
  }
  // 2. Check for individual client email & private key
  else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    try {
      credential = cert({
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'cumple-9bcd7',
      });
    } catch (error) {
      console.error('Error creating cert from individual Firebase env keys', error);
    }
  }

  _adminApp = initializeApp({
    ...(credential ? { credential } : {}),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'cumple-9bcd7',
  });

  return _adminApp;
}

export const adminApp: App = new Proxy({} as App, {
  get(_, prop) {
    return (getAdminApp() as any)[prop];
  },
});

export const adminAuth: Auth = new Proxy({} as Auth, {
  get(_, prop) {
    if (!_adminAuth) _adminAuth = getAuth(getAdminApp());
    return (_adminAuth as any)[prop];
  },
});

export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_, prop) {
    if (!_adminDb) {
      _adminDb = getFirestore(getAdminApp());
      try {
        _adminDb.settings({ ignoreUndefinedProperties: true });
      } catch (_) {
        // settings might already be frozen
      }
    }
    return (_adminDb as any)[prop];
  },
});
