import { adminDb } from '@/lib/firebase/admin';
import { evolutionApi } from '@/lib/evolution-api/client';
import { getAppUrl } from '@/lib/utils';

/**
 * Sends a friendly onboarding welcome message from the central assistant bot (+34 926 31 24 36)
 * as soon as the user connects their personal WhatsApp account.
 */
export async function sendWelcomeMessageIfNotSent(
  userId: string,
  userPhone: string,
  displayName?: string
) {
  if (!userPhone) return;

  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (userData?.hasReceivedWelcomeMessage) {
      return;
    }

    const name = displayName || userData?.displayName || 'amigo/a';
    const welcomeMsg = `👋 *¡Bienvenido a AutoBirthday, ${name}!* 🎉\n\n` +
      `Soy tu Asistente Personal de Felicitaciones (+34 926 31 24 36).\n\n` +
      `📱 *Paso muy importante:* Guarda este contacto en tu agenda como *AutoBirthday Asistente* para:\n` +
      `1. Recibir por la mañana las propuestas de felicitación de tus amigos y grupos.\n` +
      `2. Aprobarlas respondiendo simplemente *SÍ*, *EDITAR* o *NO*.\n` +
      `3. Recibir avisos urgentes si tu sesión personal necesita reconexión.\n\n` +
      `👉 Empieza añadiendo a tus primeros cumpleañeros aquí:\n${getAppUrl()}/contacts/new`;

    await evolutionApi.sendText('autobirthday-system', userPhone, welcomeMsg);

    await adminDb.collection('users').doc(userId).set({
      hasReceivedWelcomeMessage: true,
      welcomeMessageSentAt: new Date(),
    }, { merge: true });

    console.log(`✅ Welcome message dispatched to user ${userId} (${userPhone})`);
  } catch (err: any) {
    console.warn(`Could not send welcome message to user ${userId}:`, err?.message);
  }
}

/**
 * Scans for users who connected their WhatsApp >= 48 hours ago and still have 0 contacts.
 * Dispatches a single gentle activation reminder from the assistant bot.
 */
export async function checkAndSendActivationNudges(): Promise<number> {
  let nudgedCount = 0;
  const now = new Date();
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  try {
    const usersSnap = await adminDb.collection('users').get();

    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;

      // Criteria:
      // 1. WhatsApp connected
      // 2. Already received welcome message
      // 3. Has NOT received activation nudge yet
      // 4. Connected or created at least 48 hours ago
      if (
        userData?.whatsappInstance?.status !== 'connected' ||
        !userData?.whatsappInstance?.phoneNumber ||
        !userData?.hasReceivedWelcomeMessage ||
        userData?.hasReceivedActivationNudge
      ) {
        continue;
      }

      const connectedAt = userData?.whatsappInstance?.updatedAt?.toDate
        ? userData.whatsappInstance.updatedAt.toDate()
        : new Date(userData?.whatsappInstance?.updatedAt || userData?.createdAt || now);

      if (connectedAt > fortyEightHoursAgo) {
        // Not yet 48 hours old
        continue;
      }

      // Check contacts count
      const contactsSnap = await adminDb
        .collection('users')
        .doc(userId)
        .collection('contacts')
        .where('isActive', '==', true)
        .limit(1)
        .get();

      if (contactsSnap.empty) {
        const name = userData?.displayName || 'amigo/a';
        const userPhone = userData.whatsappInstance.phoneNumber;

        const nudgeMsg = `👋 *¡Hola ${name}!* 🎂\n\n` +
          `Veo que aún no has añadido a tus cumpleañeros favoritos en AutoBirthday.\n\n` +
          `Añade a tu madre, pareja o mejores amigos en 30 segundos para que nunca se te vuelva a olvidar una fecha especial:\n` +
          `👉 ${getAppUrl()}/contacts/new\n\n` +
          `_(Si prefieres no recibir recordatorios responde PAUSA)_`;

        try {
          await evolutionApi.sendText('autobirthday-system', userPhone, nudgeMsg);
          await adminDb.collection('users').doc(userId).set({
            hasReceivedActivationNudge: true,
            activationNudgeSentAt: new Date(),
          }, { merge: true });
          nudgedCount++;
        } catch (sendErr: any) {
          console.warn(`Could not send activation nudge to user ${userId}:`, sendErr?.message);
        }
      }
    }
  } catch (error: any) {
    console.error('Error during checkAndSendActivationNudges:', error);
  }

  return nudgedCount;
}
