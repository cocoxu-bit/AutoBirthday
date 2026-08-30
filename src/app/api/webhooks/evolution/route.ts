import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebase/admin';
import { evolutionApi } from '@/lib/evolution-api/client';
import { executeSendWishes } from '@/lib/scheduler/send-wishes';
import { getAppUrl } from '@/lib/utils';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event, instance, data } = body;

    if (!instance) {
      return NextResponse.json({ error: 'Missing instance' }, { status: 400 });
    }

    const instanceName = instance;
    const isSystemInstance = instanceName === 'autobirthday-system';
    const eventType = (event || '').toLowerCase().replace(/_/g, '.');

    // 1. Handle Connection Updates
    if (eventType === 'connection.update') {
      const state = data?.state || data?.instance?.state;
      let status = 'disconnected';
      if (state === 'open') status = 'connected';
      else if (state === 'connecting') status = 'connecting';
      
      if (!isSystemInstance && instanceName.startsWith('autocumple-')) {
        const userId = instanceName.replace('autocumple-', '');
        const userDoc = await adminDb.collection('users').doc(userId).get();

        // If user doc doesn't exist or account was deleted, ignore completely
        if (!userDoc.exists || userDoc.data()?.isDeleted || userDoc.data()?.isDeleting) {
          return NextResponse.json({ success: true, message: 'User deleted, webhook ignored' });
        }

        const userData = userDoc.data();
        const prevStatus = userData?.whatsappInstance?.status;
        const wasIntentionalDisconnect = userData?.whatsappInstance?.intentionalDisconnect === true;

        await adminDb.collection('users').doc(userId).set({
          whatsappInstance: {
            instanceName,
            status,
            updatedAt: new Date(),
          }
        }, { merge: true });

        // If instance connected, prewarm contacts cache and send onboarding welcome message
        if (state === 'open') {
          import('@/lib/whatsapp/sync-cache').then(m => m.prewarmWhatsAppContactsCache(userId)).catch(() => {});
          try {
            revalidatePath('/dashboard');
            revalidatePath('/whatsapp');
            revalidatePath('/contacts');
          } catch {}

          const userPhone = userData?.whatsappInstance?.phoneNumber;
          if (userPhone) {
            const { sendWelcomeMessageIfNotSent } = await import('@/lib/notifications/assistant');
            await sendWelcomeMessageIfNotSent(userId, userPhone, userData?.displayName);
          }
        }

        // If instance unexpectedly disconnected (and was NOT an intentional logout or account deletion), send alert from system bot
        if (state === 'close' && prevStatus === 'connected' && !wasIntentionalDisconnect && !userData?.isDeleted) {
          const userPhone = userData?.whatsappInstance?.phoneNumber;
          if (userPhone) {
            try {
              const alertMsg = `⚠️ *AutoBirthday: Alerta de Desconexión*\n\n` +
                `Hola! Tu sesión personal de WhatsApp se ha desconectado. Las felicitaciones programadas están en pausa hasta que reconectes tu cuenta.\n\n` +
                `🔗 *Reconéctala en 10 segundos aquí:*\n${getAppUrl()}/whatsapp`;

              await evolutionApi.sendText('autobirthday-system', userPhone, alertMsg);
            } catch (alertErr: any) {
              console.warn('Could not send disconnection alert:', alertErr.message);
            }
          }
        }
      }

      return NextResponse.json({ success: true });
    }

    // 2. Handle Incoming Messages for Approvals
    if (eventType === 'messages.upsert') {
      const message = Array.isArray(data?.messages) 
        ? data.messages[0] 
        : (data?.data?.message ? data.data : (data?.message ? data : data));

      if (!message || message.key?.fromMe) {
        return NextResponse.json({ success: true });
      }

      const text = message.message?.conversation 
        || message.message?.extendedTextMessage?.text 
        || message.conversation 
        || message.text 
        || '';
      
      const remoteJid = message.key?.remoteJid || message.remoteJid || '';
      const rawPhone = remoteJid.replace(/@.*$/, '');

      if (!text || !rawPhone) return NextResponse.json({ success: true });

      // Resolve userId: either from instance name or by looking up phone number
      let targetUserId = '';
      if (!isSystemInstance && instanceName.startsWith('autocumple-')) {
        targetUserId = instanceName.replace('autocumple-', '');
      } else {
        // Look up user by phone number
        const usersSnap = await adminDb.collection('users').get();
        for (const u of usersSnap.docs) {
          const uData = u.data();
          const phone = uData?.whatsappInstance?.phoneNumber || '';
          const cleanUPhone = phone.replace(/\D/g, '');
          const cleanRaw = rawPhone.replace(/\D/g, '');
          if (cleanUPhone && cleanRaw && (cleanUPhone === cleanRaw || cleanUPhone.endsWith(cleanRaw) || cleanRaw.endsWith(cleanUPhone))) {
            targetUserId = u.id;
            break;
          }
        }
      }

      if (!targetUserId) {
        return NextResponse.json({ success: true });
      }

      const wishesSnapshot = await adminDb.collection('wishes')
        .where('userId', '==', targetUserId)
        .where('status', '==', 'waiting_approval')
        .get();

      if (wishesSnapshot.empty) {
        return NextResponse.json({ success: true });
      }

      const upperText = text.trim().toUpperCase();
      
      for (const wishDoc of wishesSnapshot.docs) {
        const wish = wishDoc.data();
        let newStatus = wish.status;
        let finalMessage = wish.generatedMessage;
        let replyMessage = '';

        let contactName = 'el contacto';
        try {
          const contactDoc = await adminDb.collection('users').doc(targetUserId).collection('contacts').doc(wish.contactId).get();
          if (contactDoc.exists) contactName = contactDoc.data()?.name || 'el contacto';
        } catch {}

        if (['SÍ', 'SI', 'OK', 'ENVIAR', 'APROBAR', 'VALE', '1', 'CONFIRMAR', 'ADELANTE', 'DE ACUERDO'].includes(upperText)) {
          newStatus = 'queued';
          replyMessage = `✅ ¡Felicitación para *${contactName}* aprobada! Enviando hoy a su hora desde tu WhatsApp personal... 🎉`;
        } else if (['NO', 'CANCELAR', 'CANCEL', '0', 'DESCARTAR', 'NO ENVIAR'].includes(upperText)) {
          newStatus = 'cancelled';
          replyMessage = `❌ Felicitación para *${contactName}* cancelada.`;
        } else if (upperText.startsWith('EDITAR:')) {
          newStatus = 'queued';
          finalMessage = text.substring(7).trim();
          replyMessage = `✅ Mensaje editado y aprobado para *${contactName}*:\n"${finalMessage}"\n\nSe enviará hoy a su hora... 🚀`;
        }

        if (newStatus !== wish.status) {
          await wishDoc.ref.update({
            status: newStatus,
            generatedMessage: finalMessage,
            scheduledFor: newStatus === 'queued' ? new Date(Date.now() - 1000) : wish.scheduledFor,
            updatedAt: new Date(),
          });

          // If approved/edited, trigger send engine
          if (newStatus === 'queued') {
            await executeSendWishes();
          }

          // Reply back to user via WhatsApp from system assistant
          if (replyMessage) {
            try {
              const replySender = isSystemInstance ? 'autobirthday-system' : instanceName;
              await evolutionApi.sendText(replySender, rawPhone, replyMessage);
            } catch (replyErr) {
              console.warn('Could not send WhatsApp confirmation reply:', replyErr);
            }
          }
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
