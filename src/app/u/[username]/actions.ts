'use server';

import { adminDb } from '@/lib/firebase/admin';
import { getUserByUsername } from '@/lib/user/slug';
import { formatToWhatsappJid } from '@/lib/utils/phone';
import { evolutionApi } from '@/lib/evolution-api/client';
import { persistAvatarToStorage } from '@/lib/storage/avatars';
import { recordGlobalBirthday } from '@/lib/directory/global-birthdays';
import { revalidatePath } from 'next/cache';

export interface SubmitPublicBirthdayPayload {
  username: string;
  name: string;
  phone: string;
  birthDay: number;
  birthMonth: number;
  birthYear?: number | null;
  notes?: string;
  honeypot?: string; // Bot trap
}

export async function submitPublicBirthdayAction(payload: SubmitPublicBirthdayPayload): Promise<{
  success: boolean;
  updatedExisting?: boolean;
  error?: string;
}> {
  try {
    // 1. Silent Honeypot anti-spam check
    if (payload.honeypot && payload.honeypot.trim().length > 0) {
      console.warn('[PublicCollector] Bot caught via honeypot field');
      return { success: true, updatedExisting: false };
    }

    // 2. Validate host user
    const host = await getUserByUsername(payload.username);
    if (!host) {
      return { success: false, error: 'El enlace no es válido o el usuario ya no existe.' };
    }

    const hostUserId = host.userId;

    // 3. Validate input fields
    const cleanName = (payload.name || '').trim();
    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: 'Por favor, introduce tu nombre o apodo.' };
    }

    const rawPhone = payload.phone || '';
    const cleanPhone = formatToWhatsappJid(rawPhone).replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      return { success: false, error: 'Por favor, introduce un número de teléfono o WhatsApp válido.' };
    }

    const day = Number(payload.birthDay);
    const month = Number(payload.birthMonth);
    const year = payload.birthYear ? Number(payload.birthYear) : null;

    if (!day || day < 1 || day > 31 || !month || month < 1 || month > 12) {
      return { success: false, error: 'Por favor, selecciona un día y mes válidos.' };
    }

    // 4. Rate-limit check per host (Max 200 public submissions)
    const countSnap = await adminDb
      .collection('users')
      .doc(hostUserId)
      .collection('contacts')
      .where('source', '==', 'public_collector')
      .get();

    if (countSnap.size >= 250) {
      return { 
        success: false, 
        error: 'Este calendario ha alcanzado el límite máximo de solicitudes públicas.' 
      };
    }

    // 5. Duplicate Detection & Smart Merge
    const contactsRef = adminDb.collection('users').doc(hostUserId).collection('contacts');
    
    // Look for existing contact with this phone number
    const existingSnap = await contactsRef.where('phone', '==', cleanPhone).limit(1).get();

    if (!existingSnap.empty) {
      // Smart update of existing contact
      const existingDoc = existingSnap.docs[0];
      const existingData = existingDoc.data();

      const updatedNotes = payload.notes?.trim()
        ? (existingData.aiNotes ? `${existingData.aiNotes} | ${payload.notes.trim()}` : payload.notes.trim())
        : existingData.aiNotes;

      await existingDoc.ref.update({
        birthDay: day,
        birthMonth: month,
        birthYear: year !== null ? year : (existingData.birthYear || null),
        ...(updatedNotes ? { aiNotes: updatedNotes } : {}),
        updatedAt: new Date(),
      });

      // Record in Global Birthdays Directory (Self-verified)
      recordGlobalBirthday(cleanPhone, day, month, year, true).catch(() => {});

      adminDb.collection('growth_events').add({
        type: 'collector_submission',
        username: payload.username,
        hostUserId,
        contactName: cleanName,
        contactPhone: cleanPhone,
        birthDay: day,
        birthMonth: month,
        birthYear: year,
        isUpdate: true,
        createdAt: new Date(),
      }).catch(() => {});

      revalidatePath('/contacts');
      revalidatePath('/dashboard');

      return { success: true, updatedExisting: true };
    }

    // 6. Create new contact
    const cleanNotes = payload.notes?.trim() || undefined;

    const newContactDoc = await contactsRef.add({
      name: cleanName,
      phone: cleanPhone,
      birthDay: day,
      birthMonth: month,
      birthYear: year,
      targetType: 'individual',
      mode: 'ai',
      aiRelationship: 'amigo/a',
      aiTone: 'casual',
      aiNotes: cleanNotes || 'Añadido desde tu enlace público de cumpleaños',
      autoSend: false,
      sendTimeStart: '09:30',
      sendTimeEnd: '11:45',
      isActive: true,
      source: 'public_collector',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Record in Global Birthdays Directory (Self-verified)
    recordGlobalBirthday(cleanPhone, day, month, year, true).catch(() => {});

    adminDb.collection('growth_events').add({
      type: 'collector_submission',
      username: payload.username,
      hostUserId,
      contactName: cleanName,
      contactPhone: cleanPhone,
      birthDay: day,
      birthMonth: month,
      birthYear: year,
      isUpdate: false,
      createdAt: new Date(),
    }).catch(() => {});

    // 7. Background: Attempt to fetch and persist WhatsApp profile photo
    (async () => {
      try {
        const instanceName = `autocumple-${hostUserId}`;
        const pic = await evolutionApi.fetchProfilePictureUrl(instanceName, cleanPhone);
        if (pic && pic.startsWith('http')) {
          const permanentUrl = await persistAvatarToStorage(hostUserId, cleanPhone, pic);
          if (permanentUrl) {
            await newContactDoc.update({ profilePictureUrl: permanentUrl });
          }
        }
      } catch (err: any) {
        console.warn('[PublicCollector] Background avatar note:', err.message);
      }
    })();

    revalidatePath('/contacts');
    revalidatePath('/dashboard');

    return { success: true, updatedExisting: false };
  } catch (error: any) {
    console.error('submitPublicBirthdayAction error:', error);
    return {
      success: false,
      error: error.message || 'Error al guardar el cumpleaños. Inténtalo de nuevo.',
    };
  }
}
