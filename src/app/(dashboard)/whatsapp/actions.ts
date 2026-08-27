'use server';

import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { evolutionApi } from '@/lib/evolution-api/client';
import { Timestamp } from 'firebase-admin/firestore';
import { WhatsAppInstanceStatus } from '@/types';
import { formatToWhatsappJid } from '@/lib/utils/phone';
import { getAppUrl } from '@/lib/utils';

async function getAuthenticatedUserId(): Promise<string> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  if (!sessionCookie) throw new Error('Debes iniciar sesión para conectar WhatsApp');
  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decodedClaims.uid;
  } catch (err: any) {
    throw new Error('Sesión expirada o inválida. Por favor, vuelve a iniciar sesión.');
  }
}

export async function getConnectionStatus() {
  try {
    const userId = await getAuthenticatedUserId();
    const instanceName = `autocumple-${userId}`;
    
    // Check instance state in Evolution API
    const evoState = await evolutionApi.getConnectionState(instanceName);
    
    let currentStatus: WhatsAppInstanceStatus = 'disconnected';
    if (evoState.instance?.state === 'open') {
      currentStatus = 'connected';
    } else if (evoState.instance?.state === 'connecting') {
      currentStatus = 'connecting';
    }

    // Try to get owner phone number from Evolution API
    let phoneNumber: string | undefined;
    try {
      const instances = await evolutionApi.fetchInstances();
      const inst = instances.find((i: any) => i.name === instanceName || i.instance?.instanceName === instanceName);
      if (inst?.ownerJid) {
        phoneNumber = inst.ownerJid.replace(/@.*$/, '');
      }
    } catch {}

    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!phoneNumber && userData?.whatsappInstance?.phoneNumber) {
      phoneNumber = userData.whatsappInstance.phoneNumber;
    }
    
    await adminDb.collection('users').doc(userId).set({
      whatsappInstance: {
        instanceName,
        status: currentStatus,
        phoneNumber: phoneNumber || null,
        updatedAt: Timestamp.now()
      }
    }, { merge: true });

    // Send onboarding welcome message from system assistant if first time connected
    if (currentStatus === 'connected' && phoneNumber) {
      const { sendWelcomeMessageIfNotSent } = await import('@/lib/notifications/assistant');
      await sendWelcomeMessageIfNotSent(userId, phoneNumber, userData?.displayName);
    }

    return { 
      status: currentStatus, 
      phoneNumber: phoneNumber || null
    };
  } catch (error) {
    return { status: 'disconnected' as WhatsAppInstanceStatus };
  }
}

export async function connectInstance() {
  try {
    const userId = await getAuthenticatedUserId();
    const instanceName = `autocumple-${userId}`;
    const webhookUrl = `${getAppUrl()}/api/webhooks/evolution`;
    
    // Ensure instance is created in Evolution API
    try {
      const instances = await evolutionApi.fetchInstances().catch(() => []);
      const exists = instances?.some((inst: any) => inst.name === instanceName || inst.instance?.instanceName === instanceName);
      
      if (!exists) {
        await evolutionApi.createInstance(instanceName, webhookUrl);
      }
    } catch (createErr: any) {
      console.warn('Instance creation note:', createErr?.message);
    }
    
    const qrResponse = await evolutionApi.getQRCode(instanceName);
    
    await adminDb.collection('users').doc(userId).set({
      whatsappInstance: {
        instanceName,
        status: 'connecting',
        updatedAt: Timestamp.now()
      }
    }, { merge: true });
    
    return { success: true, qr: qrResponse.base64 };
  } catch (error: any) {
    console.error('Error in connectInstance:', error);
    return { success: false, error: error.message || 'Error al conectar instancia' };
  }
}

export async function connectWithPairingCode(phone: string) {
  try {
    const userId = await getAuthenticatedUserId();
    const instanceName = `autocumple-${userId}`;
    const webhookUrl = `${getAppUrl()}/api/webhooks/evolution`;

    if (!phone || phone.trim().length < 7) {
      return { success: false, error: 'Por favor, introduce un número de teléfono válido con prefijo de país (ej: 34612345678)' };
    }

    // Ensure instance is created in Evolution API
    try {
      const instances = await evolutionApi.fetchInstances().catch(() => []);
      const exists = instances?.some((inst: any) => inst.name === instanceName || inst.instance?.instanceName === instanceName);
      
      if (!exists) {
        await evolutionApi.createInstance(instanceName, webhookUrl);
      }
    } catch (createErr: any) {
      console.warn('Instance creation note:', createErr?.message);
    }

    const cleanPhone = formatToWhatsappJid(phone);
    const response = await evolutionApi.getPairingCode(instanceName, cleanPhone);
    const pairingCode = response.pairingCode || response.code;

    if (!pairingCode) {
      return { success: false, error: 'No se pudo generar el código. Verifica el número e inténtalo de nuevo.' };
    }

    await adminDb.collection('users').doc(userId).set({
      whatsappInstance: {
        instanceName,
        status: 'connecting',
        updatedAt: Timestamp.now()
      }
    }, { merge: true });

    return { success: true, pairingCode };
  } catch (error: any) {
    console.error('Error in connectWithPairingCode:', error);
    return { success: false, error: error.message || 'Error al generar código de emparejamiento' };
  }
}

export async function refreshQRCode() {
  try {
    const userId = await getAuthenticatedUserId();
    const instanceName = `autocumple-${userId}`;
    const qrResponse = await evolutionApi.getQRCode(instanceName);
    return { success: true, qr: qrResponse.base64 };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function disconnectInstance() {
  try {
    const userId = await getAuthenticatedUserId();
    const instanceName = `autocumple-${userId}`;
    
    try {
      await evolutionApi.logout(instanceName);
      await evolutionApi.deleteInstance(instanceName);
    } catch (e) {
      console.warn("Evolution delete failed:", e);
    }
    
    await adminDb.collection('users').doc(userId).set({
      whatsappInstance: {
        instanceName,
        status: 'disconnected',
        phoneNumber: null,
        updatedAt: Timestamp.now()
      }
    }, { merge: true });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function sendTestMessage(targetPhone?: string) {
  try {
    const userId = await getAuthenticatedUserId();
    const instanceName = `autocumple-${userId}`;

    // Verify WhatsApp connection in Evolution API
    const evoState = await evolutionApi.getConnectionState(instanceName);
    if (evoState.instance?.state !== 'open') {
      return { success: false, error: 'WhatsApp no está conectado. Escanea el código QR primero.' };
    }

    let phone = targetPhone?.trim();

    // If no target phone passed, look for owner phone in Evolution API
    if (!phone) {
      const instances = await evolutionApi.fetchInstances();
      const inst = instances.find((i: any) => i.name === instanceName || i.instance?.instanceName === instanceName);
      if (inst?.ownerJid) {
        phone = inst.ownerJid.replace(/@.*$/, '');
      }
    }

    // Fallback to Firestore user record
    if (!phone) {
      const userDoc = await adminDb.collection('users').doc(userId).get();
      phone = userDoc.data()?.whatsappInstance?.phoneNumber;
    }

    if (!phone) {
      return { success: false, error: 'Por favor, escribe el número de teléfono al que deseas enviar la prueba.' };
    }

    const cleanPhone = formatToWhatsappJid(phone);

    // Send test message from autobirthday-system assistant bot (with fallback to user instance)
    let senderInstance = 'autobirthday-system';
    try {
      const sysState = await evolutionApi.getConnectionState('autobirthday-system');
      if (sysState?.instance?.state !== 'open') {
        senderInstance = instanceName;
      }
    } catch {
      senderInstance = instanceName;
    }

    const testMessageText = `🤖 *AutoBirthday Asistente*\n\n` +
      `🎉 *¡Conexión Verificada con Éxito!*\n\n` +
      `Tu cuenta de WhatsApp está correctamente vinculada y lista para funcionar.\n\n` +
      `A partir de ahora, desde este chat te enviaré las propuestas de felicitación de tus amigos y grupos para que puedas aprobarlas o editarlas antes de enviarse.\n\n` +
      `¡Todo listo para que nunca se te pase ningún cumpleaños! 🎂✨`;

    await evolutionApi.sendText(
      senderInstance,
      cleanPhone,
      testMessageText
    );

    return { success: true, phone: cleanPhone };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al enviar el mensaje de prueba' };
  }
}
