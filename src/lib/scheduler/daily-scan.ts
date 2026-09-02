import { adminDb } from '@/lib/firebase/admin';
import { toZonedTime } from 'date-fns-tz';
import { calculateScheduledTime } from '@/lib/scheduler/jitter';
import { generateBirthdayWish } from '@/lib/ai/generate-wish';
import { evolutionApi } from '@/lib/evolution-api/client';
import { getAppUrl } from '@/lib/utils';
import { AiTone } from '@/types';

/**
 * Checks if a given year is a leap year.
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export interface ScanResult {
  scanned: number;
  created: number;
  errors: number;
  details: Array<{
    contactId: string;
    name: string;
    status: string;
    mode: string;
    message: string;
  }>;
}

/**
 * Executes the daily birthday scan logic for all active contacts across all users.
 * Supports leap-year edge cases: in non-leap years, Feb 29 birthdays are processed on Feb 28.
 *
 * @param customDate Optional date override (useful for testing specific calendar dates)
 * @param timezone Timezone string (defaults to 'Europe/Madrid')
 */
export async function executeDailyScan(
  customDate?: Date,
  timezone: string = 'Europe/Madrid'
): Promise<ScanResult> {
  const now = customDate || new Date();
  const today = toZonedTime(now, timezone);
  const day = today.getDate();
  const month = today.getMonth() + 1; // 1-12
  const year = today.getFullYear();

  // Determine dates to query:
  // Usually just today's (month, day).
  // Edge Case: If today is Feb 28 and it's NOT a leap year, also include Feb 29.
  const targetDates: Array<{ month: number; day: number; isLeapFallback?: boolean }> = [
    { month, day }
  ];

  if (month === 2 && day === 28 && !isLeapYear(year)) {
    targetDates.push({ month: 2, day: 29, isLeapFallback: true });
  }

  let scanned = 0;
  let created = 0;
  let errors = 0;
  const details: ScanResult['details'] = [];

  for (const target of targetDates) {
    const contactsDocs: Array<{ id: string; data: () => any; userId: string }> = [];
    const usersMap = new Map<string, any>();

    const usersSnapshot = await adminDb.collection('users').get();
    for (const userDoc of usersSnapshot.docs) {
      usersMap.set(userDoc.id, userDoc.data());
      const userContacts = await adminDb
        .collection('users')
        .doc(userDoc.id)
        .collection('contacts')
        .where('isActive', '==', true)
        .where('birthMonth', '==', target.month)
        .where('birthDay', '==', target.day)
        .get();

      for (const cDoc of userContacts.docs) {
        contactsDocs.push({
          id: cDoc.id,
          data: () => cDoc.data(),
          userId: userDoc.id,
        });
      }
    }

    for (const item of contactsDocs) {
      scanned++;
      try {
        const contact = item.data();
        const userId = item.userId;

        if (!userId) {
          console.warn(`Contact ${item.id} does not have a valid parent user`);
          continue;
        }

        // Check if a wish has already been created for this contact in the current year
        const existingWishSnapshot = await adminDb
          .collection('wishes')
          .where('contactId', '==', item.id)
          .where('year', '==', year)
          .limit(1)
          .get();

        if (!existingWishSnapshot.empty) {
          // Already generated for this year
          continue;
        }

        let generatedMessage = contact.customMessage || '';
        const age = contact.birthYear ? year - contact.birthYear : undefined;
        const currentUserData = usersMap.get(userId);

        if (contact.mode === 'template' && contact.templateId) {
          const templateDoc = await adminDb
            .collection('users')
            .doc(userId)
            .collection('templates')
            .doc(contact.templateId)
            .get();

          if (templateDoc.exists) {
            generatedMessage = templateDoc.data()?.content || '';
            generatedMessage = generatedMessage.replace(/\{nombre\}/g, contact.name);
            if (age !== undefined) {
              generatedMessage = generatedMessage.replace(/\{edad\}/g, age.toString());
            }
          }
        } else if (contact.mode === 'ai') {
          generatedMessage = await generateBirthdayWish({
            name: contact.name,
            age,
            relationship: contact.aiRelationship || 'amigo/a',
            tone: (contact.aiTone as AiTone) || 'casual',
            notes: contact.aiNotes,
            isGroup: contact.targetType === 'group',
            groupName: contact.groupName,
            mentionInGroup: contact.mentionInGroup,
            phone: contact.phone,
            locale: currentUserData?.locale || 'es',
          });
        }

        const isGroupTarget = contact.targetType === 'group' && Boolean(contact.groupId);
        // Groups strictly require prior confirmation for safety
        const status = (!isGroupTarget && contact.autoSend) ? 'queued' : 'waiting_approval';

        const scheduledFor = calculateScheduledTime(
          contact.sendTimeStart || '09:00',
          contact.sendTimeEnd || '14:00',
          timezone,
          scanned
        );

        await adminDb.collection('wishes').add({
          contactId: item.id,
          userId,
          year,
          generatedMessage,
          status,
          scheduledFor,
          targetType: contact.targetType || 'individual',
          groupId: contact.groupId || null,
          groupName: contact.groupName || null,
          mentionInGroup: contact.mentionInGroup ?? true,
          targetPhone: contact.phone,
          createdAt: new Date(),
        });

        // If approval is required, notify the user via WhatsApp
        if (status === 'waiting_approval') {
          try {
            const userDoc = await adminDb.collection('users').doc(userId).get();
            const userData = userDoc.data();
            const instanceName = userData?.whatsappInstance?.instanceName || `autocumple-${userId}`;
            let userPhone = userData?.whatsappInstance?.phoneNumber;

            if (!userPhone) {
              const instances = await evolutionApi.fetchInstances().catch(() => []);
              const inst = instances.find((i: any) => i.name === instanceName || i.instance?.instanceName === instanceName);
              if (inst?.ownerJid) {
                userPhone = inst.ownerJid.replace(/@.*$/, '');
              }
            }

            if (userPhone) {
              const ageText = age !== undefined ? ` (${age} años)` : '';
              const targetDesc = contact.targetType === 'group' 
                ? `👥 *Grupo:* ${contact.groupName || 'Grupo de WhatsApp'}`
                : `👤 *Chat Privado:* ${contact.name}`;

              const approvalText = `🎂 *¡AutoBirthday: Cumpleaños de ${contact.name}${ageText}!*
${targetDesc}

🤖 *Mensaje propuesto con IA:*
"${generatedMessage}"

━━━━━━━━━━━━━━━━━━━━
👉 *¿Qué deseas hacer?*
• Responde *SÍ* para aprobar y programar el envío.
• O responde *EDITAR: tu nuevo texto* para modificarlo y enviarlo.
• O responde *NO* para cancelarlo.
• O gestiónalo en la web: ${getAppUrl()}/wishes`;

              // Send from central system assistant if available, or fallback to user's instance
              let senderInstance = 'autobirthday-system';
              try {
                const sysState = await evolutionApi.getConnectionState('autobirthday-system');
                if (sysState?.instance?.state !== 'open') {
                  senderInstance = instanceName;
                }
              } catch {
                senderInstance = instanceName;
              }

              await evolutionApi.sendText(senderInstance, userPhone, approvalText);
            }
          } catch (notifErr: any) {
            console.warn(`Could not send WhatsApp approval notification to user ${userId}:`, notifErr?.message);
          }
        }

        created++;
        details.push({
          contactId: item.id,
          name: contact.name,
          status,
          mode: contact.mode || 'manual',
          message: generatedMessage,
        });
      } catch (err) {
        console.error(`Error processing birthday scan for contact ${item.id}:`, err);
        errors++;
      }
    }
  }

  // Scan and dispatch gentle 48h activation reminders for users with 0 contacts
  try {
    const { checkAndSendActivationNudges } = await import('@/lib/notifications/assistant');
    await checkAndSendActivationNudges();
  } catch (nudgeErr: any) {
    console.warn('Activation nudge scan error:', nudgeErr?.message);
  }

  return { scanned, created, errors, details };
}
