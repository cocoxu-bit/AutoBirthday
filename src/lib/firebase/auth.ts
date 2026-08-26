'use client';

import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { auth } from './config';

function mapAuthError(error: any): string {
  const code = error?.code || '';
  switch (code) {
    case 'auth/operation-not-allowed':
      return 'El proveedor de autenticación con Correo/Contraseña no está habilitado en la consola de Firebase. Actívalo en Firebase Console > Authentication > Sign-in method.';
    case 'auth/configuration-not-found':
      return 'Autenticación no configurada en Firebase. Habilita Authentication en la consola de Firebase.';
    case 'auth/email-already-in-use':
      return 'Este correo electrónico ya está registrado. Inicia sesión en su lugar.';
    case 'auth/invalid-email':
      return 'El formato del correo electrónico no es válido.';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Correo electrónico o contraseña incorrectos.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Por favor, inténtalo de nuevo más tarde.';
    case 'auth/network-request-failed':
      return 'Error de conexión con Firebase. Revisa tu conexión a internet.';
    default:
      return error?.message || 'Ha ocurrido un error en la autenticación.';
  }
}

export async function signUp(email: string, password: string, displayName: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }
    return userCredential.user;
  } catch (error: any) {
    throw new Error(mapAuthError(error));
  }
}

export async function signIn(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    throw new Error(mapAuthError(error));
  }
}

export async function signOutUser() {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(mapAuthError(error));
  }
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return await user.getIdToken(true);
}
