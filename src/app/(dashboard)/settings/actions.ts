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
    
    // 0. Mark user as deleted to silence disconnection webhooks
    await adminDb.collection('users').doc(userId).set({
      isDeleted: true,
      isDeleting: true,
    }, { merge: true }).catch(() => {});

    // 1. Delete WhatsApp Evolution API instance
    try {
      const { evolutionApi } = await import('@/lib/evolution-api/client');
      await evolutionApi.deleteInstance(`autocumple-${userId}`).catch(() => {});
    } catch {}

    // 2. Delete user from Auth
    await adminAuth.deleteUser(userId);
    
    // 3. Delete user profile and subcollections
    const subcollections = ['contacts', 'wishes', 'templates', 'wa_contacts_cache', 'whatsapp'];
    for (const sub of subcollections) {
      try {
        const snap = await adminDb.collection('users').doc(userId).collection(sub).get();
        if (!snap.empty) {
          const batch = adminDb.batch();
          snap.docs.forEach(d => batch.delete(d.ref));
          await batch.commit();
        }
      } catch {}
    }
    
    await adminDb.collection('users').doc(userId).delete();
    
    // 4. Delete wishes for user
    const wishesSnap = await adminDb.collection('wishes').where('userId', '==', userId).get();
    for (const d of wishesSnap.docs) {
      await d.ref.delete();
    }
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
