import { adminDb } from '@/lib/firebase/admin';
import { evolutionApi } from '@/lib/evolution-api/client';
import { formatToWhatsappJid } from '@/lib/utils/phone';
import { toZonedTime } from 'date-fns-tz';

export interface SendResult {
  sent: number;
  failed: number;
  skipped: number;
  expired?: number;
  details: Array<{
    wishId: string;
    contactId: string;
    contactName: string;
    phone: string;
    targetType?: string;
    targetName?: string;
    status: 'sent' | 'failed' | 'skipped' | 'expired';
    error?: string;
  }>;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Processes queued birthday wishes that are due for delivery.
 * Supports sending directly to individual chats or WhatsApp Groups with optional @mentions.
 * Features rate-limiting between sends, message sanitization, and 21:00 timeout policy.
 *
 * @param customNow Optional timestamp for testing
 * @param limit Maximum number of wishes to process in one batch (default 50)
 */
export async function executeSendWishes(
  customNow?: Date,
  limit: number = 50
): Promise<SendResult> {
  const now = customNow || new Date();
  const zonedMadrid = toZonedTime(now, 'Europe/Madrid');
  const currentMadridHour = zonedMadrid.getHours();

  let expiredCount = 0;
  const details: SendResult['details'] = [];

  // 1. Timeout Policy: Expire unapproved wishes if >= 21:00 Madrid time
  if (currentMadridHour >= 21) {
    try {
      const pendingApprovalSnapshot = await adminDb
        .collection('wishes')
        .where('status', '==', 'waiting_approval')
        .limit(100)
        .get();

      for (const pDoc of pendingApprovalSnapshot.docs) {
        await pDoc.ref.update({
          status: 'expired',
          errorLog: 'Expirado a las 21:00 sin confirmación del usuario para evitar envíos nocturnos.',
          updatedAt: new Date(),
        });
        expiredCount++;
        details.push({
          wishId: pDoc.id,
          contactId: pDoc.data().contactId,
          contactName: 'Pendiente de aprobación',
          phone: '',
          status: 'expired',
          error: 'Expirado por política de seguridad nocturna (21:00)',
        });
      }
    } catch (expErr: any) {
      console.warn('Error during wish expiration check:', expErr?.message);
    }
  }

  // 2. Fetch Queued Wishes
  let wishesDocs: any[] = [];
  try {
    const wishesSnapshot = await adminDb
      .collection('wishes')
      .where('status', '==', 'queued')
      .where('scheduledFor', '<=', now)
      .limit(limit)
      .get();
    wishesDocs = wishesSnapshot.docs;
  } catch (queryErr) {
    // Fallback if composite index is pending: fetch queued and filter in memory
    const queuedSnapshot = await adminDb
      .collection('wishes')
      .where('status', '==', 'queued')
      .limit(limit * 2)
      .get();

    wishesDocs = queuedSnapshot.docs.filter(d => {
      const data = d.data();
      const sched = data.scheduledFor?.toDate ? data.scheduledFor.toDate() : new Date(data.scheduledFor);
      return sched <= now;
    }).slice(0, limit);
  }

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < wishesDocs.length; i++) {
    const doc = wishesDocs[i];
    const wish = doc.data();
    try {
      // Anti-Spam Rate Limiting: Delay 8s to 15s between consecutive sends
      if (sent > 0) {
        const jitterMs = Math.floor(Math.random() * (15000 - 8000 + 1)) + 8000;
        await sleep(jitterMs);
      }

      const userDoc = await adminDb.collection('users').doc(wish.userId).get();
      const userData = userDoc.data();

      if (!userData?.whatsappInstance || userData.whatsappInstance.status !== 'connected') {
        const errMsg = 'Instancia de WhatsApp no conectada';
        console.warn(`User ${wish.userId} WhatsApp not connected. Skipping wish ${doc.id}`);
        details.push({
          wishId: doc.id,
          contactId: wish.contactId,
          contactName: 'Desconocido',
          phone: '',
          status: 'skipped',
          error: errMsg,
        });
        skipped++;
        continue;
      }

      const contactDoc = await adminDb
        .collection('users')
        .doc(wish.userId)
        .collection('contacts')
        .doc(wish.contactId)
        .get();
      const contactData = contactDoc.data();

      if (!contactData || !contactData.isActive) {
        throw new Error('Contacto inactivo o no encontrado');
      }

      const instanceName = userData.whatsappInstance.instanceName;
      const isGroup = contactData.targetType === 'group' && Boolean(contactData.groupId);
      const cleanPhone = contactData.phone ? formatToWhatsappJid(contactData.phone) : '';
      const destination = isGroup ? contactData.groupId : cleanPhone;

      if (!destination) {
        throw new Error('Destino no especificado (falta número de teléfono o grupo de WhatsApp)');
      }

      // Message Sanitization
      let finalMessage = (wish.generatedMessage || '').trim();
      if (!finalMessage) {
        throw new Error('El mensaje de felicitación está vacío');
      }

      // Replace any residual un-interpolated template variables
      if (finalMessage.includes('{nombre}') || finalMessage.includes('{edad}')) {
        const currentYear = new Date().getFullYear();
        const age = contactData.birthYear ? currentYear - contactData.birthYear : undefined;
        finalMessage = finalMessage
          .replace(/\{nombre\}/gi, contactData.name.split(' ')[0])
          .replace(/\{edad\}/gi, age ? `${age}` : '');
      }

      const options: any = {};
      if (isGroup && contactData.mentionInGroup && cleanPhone) {
        options.mentioned = [cleanPhone];
      }

      await evolutionApi.sendText(instanceName, destination, finalMessage, options);

      await doc.ref.update({
        status: 'sent',
        generatedMessage: finalMessage,
        sentAt: new Date(),
        errorLog: null,
      });

      sent++;
      details.push({
        wishId: doc.id,
        contactId: wish.contactId,
        contactName: contactData.name,
        phone: cleanPhone,
        targetType: isGroup ? 'group' : 'individual',
        targetName: isGroup ? contactData.groupName : contactData.name,
        status: 'sent',
      });
    } catch (error: any) {
      console.error(`Error sending birthday wish ${doc.id}:`, error);
      const errMsg = error.message || 'Error desconocido al enviar';
      await doc.ref.update({
        status: 'failed',
        errorLog: errMsg,
      });
      failed++;
      details.push({
        wishId: doc.id,
        contactId: wish.contactId,
        contactName: 'Desconocido',
        phone: '',
        status: 'failed',
        error: errMsg,
      });
    }
  }

  return { sent, failed, skipped, expired: expiredCount, details };
}
