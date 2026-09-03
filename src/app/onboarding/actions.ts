'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { getUserProfile, updateUserProfile, getContacts } from '@/lib/firebase/firestore';
import { evolutionApi } from '@/lib/evolution-api/client';

async function getAuthenticatedUserId(): Promise<string> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  if (!sessionCookie) throw new Error('No autorizado');
  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decodedClaims.uid;
  } catch {
    throw new Error('Sesión inválida');
  }
}

export async function completeOnboardingAction() {
  try {
    const userId = await getAuthenticatedUserId();
    await updateUserProfile(userId, { hasCompletedOnboarding: true });
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al completar el onboarding' };
  }
}

export async function getOnboardingInitialStatus() {
  try {
    const userId = await getAuthenticatedUserId();
    const profile = await getUserProfile(userId);
    const instanceName = `autocumple-${userId}`;
    
    let isWhatsAppConnected = false;
    let phoneNumber: string | null = null;
    
    try {
      const evoState = await evolutionApi.getConnectionState(instanceName);
      if (evoState && evoState.instance && evoState.instance.state === 'open') {
        isWhatsAppConnected = true;
      }
    } catch {
      // Not connected
    }

    const contacts = await getContacts(userId);

    return {
      success: true,
      hasCompletedOnboarding: Boolean(profile?.hasCompletedOnboarding),
      isWhatsAppConnected,
      phoneNumber,
      contactsCount: contacts.length,
      displayName: profile?.displayName || '',
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
