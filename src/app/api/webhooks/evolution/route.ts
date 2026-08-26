import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { evolutionApi } from '@/lib/evolution-api/client';
import { executeSendWishes } from '@/lib/scheduler/send-wishes';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event, instance, data } = body;

    if (!instance) {
      return NextResponse.json({ error: 'Missing instance' }, { status: 400 });
    }

    const instanceName = instance; // autocumple-{userId}
    const userId = instanceName.replace('autocumple-', '');
    const eventType = (event || '').toLowerCase().replace(/_/g, '.');

    // 1. Handle Connection Updates
    if (eventType === 'connection.update') {
      const state = data?.state || data?.instance?.state;
      let status = 'disconnected';
      if (state === 'open') status = 'connected';
      else if (state === 'connecting') status = 'connecting';
      
      await adminDb.collection('users').doc(userId).set({
        whatsappInstance: {
          instanceName,
          status,
          updatedAt: new Date(),
        }
      }, { merge: true });

      return NextResponse.json({ success: true });
    }

    // 2. Handle Incoming Messages for Approvals
    if (eventType === 'messages.upsert') {
      // Baileys / Evolution v2 payloads can have data.messages, data.data, or data directly
      const message = Array.isArray(data?.messages) 
        ? data.messages[0] 
        : (data?.data?.message ? data.data : (data?.message ? data : data));

      if (!message) {
        return NextResponse.json({ success: true });
      }

      const text = message.message?.conversation 
        || message.message?.extendedTextMessage?.text 
        || message.conversation 
        || message.text 
        || '';
      
      const remoteJid = message.key?.remoteJid || message.remoteJid || '';
      const phone = remoteJid.replace(/@.*$/, '');

      if (!text || !phone) return NextResponse.json({ success: true });

      const wishesSnapshot = await adminDb.collection('wishes')
        .where('userId', '==', userId)
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

        // Get contact details for personalized confirmation
        let contactName = 'el contacto';
        try {
          const contactDoc = await adminDb.collection('users').doc(userId).collection('contacts').doc(wish.contactId).get();
          if (contactDoc.exists) contactName = contactDoc.data()?.name || 'el contacto';
        } catch {}

        if (['SÍ', 'SI', 'OK', 'ENVIAR', 'APROBAR', 'VALE', '1'].includes(upperText)) {
          newStatus = 'queued';
          replyMessage = `✅ ¡Felicitación para *${contactName}* aprobada! Enviando ahora mismo por WhatsApp... 🎉`;
        } else if (['NO', 'CANCELAR', 'CANCEL', '0'].includes(upperText)) {
          newStatus = 'cancelled';
          replyMessage = `❌ Felicitación para *${contactName}* cancelada.`;
        } else if (upperText.startsWith('EDITAR:')) {
          newStatus = 'queued';
          finalMessage = text.substring(7).trim();
          replyMessage = `✅ Mensaje editado y aprobado para *${contactName}*:\n"${finalMessage}"\n\nEnviando ahora mismo... 🚀`;
        }

        if (newStatus !== wish.status) {
          await wishDoc.ref.update({
            status: newStatus,
            generatedMessage: finalMessage,
            scheduledFor: newStatus === 'queued' ? new Date(Date.now() - 1000) : wish.scheduledFor,
            updatedAt: new Date(),
          });

          // If approved/edited, trigger immediate send
          if (newStatus === 'queued') {
            await executeSendWishes();
          }

          // Reply back to user via WhatsApp
          if (replyMessage) {
            try {
              await evolutionApi.sendText(instanceName, phone, replyMessage);
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
