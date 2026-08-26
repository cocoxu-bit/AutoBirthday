'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { updateUserProfile } from '@/lib/firebase/firestore';

async function getAuthenticatedUserId(): Promise<string> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  if (!sessionCookie) throw new Error('No autenticado');
  const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
  return decoded.uid;
}

export async function updateUserSettings(data: {
  displayName?: string;
  timezone?: string;
  defaultSendTimeStart?: string;
  defaultSendTimeEnd?: string;
  defaultAiTone?: string;
}) {
  try {
    const userId = await getAuthenticatedUserId();
    
    if (data.displayName) {
      await adminAuth.updateUser(userId, { displayName: data.displayName }).catch(() => {});
    }
    
    await updateUserProfile(userId, {
      ...data,
      updatedAt: new Date(),
    });
    
    revalidatePath('/settings');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteAccount() {
  try {
    const userId = await getAuthenticatedUserId();
    
    // Delete user from Auth
    await adminAuth.deleteUser(userId);
    
    // Delete user profile and subcollections
    await adminDb.collection('users').doc(userId).delete();
    
    // Delete wishes for user
    const wishesSnap = await adminDb.collection('wishes').where('userId', '==', userId).get();
    for (const d of wishesSnap.docs) {
      await d.ref.delete();
    }
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
