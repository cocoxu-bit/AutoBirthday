import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { evolutionApi } from '@/lib/evolution-api/client';
import { WhatsAppInstanceStatus } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userId = decodedClaims.uid;

    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const instanceName = userData?.whatsappInstance?.instanceName || `autocumple-${userId}`;

    let status: WhatsAppInstanceStatus = 'disconnected';
    let phoneNumber = userData?.whatsappInstance?.phoneNumber || null;

    try {
      const stateRes = await evolutionApi.getConnectionState(instanceName);
      const state = stateRes?.instance?.state;

      if (state === 'open') {
        status = 'connected';
      } else if (state === 'connecting') {
        status = 'connecting';
      } else {
        status = 'disconnected';
      }

      // If connected, ensure phone number is detected
      if (status === 'connected' && !phoneNumber) {
        const instances = await evolutionApi.fetchInstances().catch(() => []);
        const inst = instances?.find((i: any) => i.name === instanceName || i.instance?.instanceName === instanceName);
        if (inst?.ownerJid) {
          phoneNumber = `+${inst.ownerJid.replace(/@.*$/, '')}`;
        }
      }

      // Sync Firestore with live state
      await adminDb.collection('users').doc(userId).set({
        whatsappInstance: {
          instanceName,
          status,
          ...(phoneNumber ? { phoneNumber } : {}),
          updatedAt: new Date()
        }
      }, { merge: true });

    } catch (err: any) {
      console.warn('Error querying evolutionApi connectionState:', err.message);
    }

    return NextResponse.json({
      success: true,
      status,
      phoneNumber,
      instanceName
    });

  } catch (error: any) {
    console.error('WhatsApp status API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
