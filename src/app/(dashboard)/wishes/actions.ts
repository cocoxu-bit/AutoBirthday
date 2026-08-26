'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { adminAuth } from '@/lib/firebase/admin';
import { getWish, updateWish } from '@/lib/firebase/firestore';
import { executeSendWishes } from '@/lib/scheduler/send-wishes';

async function getAuthenticatedUserId(): Promise<string> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  if (!sessionCookie) throw new Error('No autenticado');
  const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
  return decoded.uid;
}

async function verifyWishOwnership(wishId: string, userId: string) {
  const wish = await getWish(wishId);
  if (!wish) throw new Error('Felicitación no encontrada');
  if (wish.userId !== userId) throw new Error('No autorizado');
  return wish;
}

export async function approveWish(wishId: string) {
  try {
    const userId = await getAuthenticatedUserId();
    await verifyWishOwnership(wishId, userId);
    
    // Set to ready for immediate send
    const scheduledFor = new Date(Date.now() - 1000);
    
    await updateWish(wishId, {
      status: 'queued',
      scheduledFor,
    });
    
    // Trigger immediate send delivery
    await executeSendWishes();
    
    revalidatePath('/wishes');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function editWishMessage(wishId: string, newMessage: string) {
  try {
    const userId = await getAuthenticatedUserId();
    await verifyWishOwnership(wishId, userId);
    
    await updateWish(wishId, {
      generatedMessage: newMessage,
    });
    
    revalidatePath('/wishes');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function cancelWish(wishId: string) {
  try {
    const userId = await getAuthenticatedUserId();
    await verifyWishOwnership(wishId, userId);
    
    await updateWish(wishId, {
      status: 'cancelled',
    });
    
    revalidatePath('/wishes');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function retryWish(wishId: string) {
  try {
    const userId = await getAuthenticatedUserId();
    await verifyWishOwnership(wishId, userId);
    
    const scheduledFor = new Date(Date.now() - 1000);
    
    await updateWish(wishId, {
      status: 'queued',
      scheduledFor,
      errorLog: '',
    });
    
    await executeSendWishes();
    
    revalidatePath('/wishes');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
