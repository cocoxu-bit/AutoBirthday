'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { adminAuth } from '@/lib/firebase/admin';
import { createContact as dbCreateContact } from '@/lib/firebase/firestore';
import { evolutionApi } from '@/lib/evolution-api/client';
import { fetchGoogleCalendarBirthdays } from '@/lib/integrations/google-calendar';
import { fetchICloudCalendarBirthdays } from '@/lib/integrations/icloud-calendar';
import { findBestWhatsAppMatch } from '@/lib/parsers/fuzzy-match';
import { WhatsAppChatContact, ContactSource } from '@/types';

async function getAuthenticatedUserId(): Promise<string> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  if (!sessionCookie) throw new Error('No autenticado');
  const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
  return decodedClaims.uid;
}

export interface SyncedContactPreview {
  id: string;
  name: string;
  birthDay: number;
  birthMonth: number;
  birthYear: number | null;
  source: ContactSource;
  
  // WhatsApp Matching
  matchedPhone: string;
  matchedName: string;
  matchedPushName?: string;
  profilePictureUrl?: string | null;
  matchScore: number;
  isAutoMatched: boolean;
  selected: boolean;
}

export async function syncGoogleCalendarAction(accessToken: string): Promise<{
  success: boolean;
  items?: SyncedContactPreview[];
  availableWhatsAppContacts?: WhatsAppChatContact[];
  error?: string;
}> {
  try {
    const userId = await getAuthenticatedUserId();
    const rawBirthdays = await fetchGoogleCalendarBirthdays(accessToken);

    if (rawBirthdays.length === 0) {
      return {
        success: false,
        error: 'No se encontraron eventos de cumpleaños en tu Google Calendar.',
      };
    }

    // Fetch user's WhatsApp contacts for cross-referencing
    const instanceName = `autocumple-${userId}`;
    let waContacts: WhatsAppChatContact[] = [];
    try {
      waContacts = await evolutionApi.fetchChats(instanceName);
    } catch {}

    const previews: SyncedContactPreview[] = [];

    for (const bday of rawBirthdays) {
      const match = findBestWhatsAppMatch(bday.name, waContacts, 40);
      const isAuto = match.confidence >= 65;

      previews.push({
        id: bday.id,
        name: bday.name,
        birthDay: bday.birthDay,
        birthMonth: bday.birthMonth,
        birthYear: bday.birthYear,
        source: 'google_calendar',
        matchedPhone: match.suggestedPhone || '',
        matchedName: match.matchedContact?.name || '',
        matchedPushName: match.matchedContact?.pushName,
        matchScore: match.confidence,
        isAutoMatched: isAuto,
        selected: isAuto,
      });
    }

    // Sort by match score descending (most reliable on top)
    previews.sort((a, b) => b.matchScore - a.matchScore);

    return {
      success: true,
      items: previews,
      availableWhatsAppContacts: waContacts,
    };
  } catch (error: any) {
    console.error('syncGoogleCalendarAction error:', error);
    return {
      success: false,
      error: error.message || 'Error al sincronizar con Google Calendar',
    };
  }
}

export async function syncICloudCalendarAction(calendarUrl: string): Promise<{
  success: boolean;
  items?: SyncedContactPreview[];
  availableWhatsAppContacts?: WhatsAppChatContact[];
  error?: string;
}> {
  try {
    const userId = await getAuthenticatedUserId();
    const rawBirthdays = await fetchICloudCalendarBirthdays(calendarUrl);

    if (rawBirthdays.length === 0) {
      return {
        success: false,
        error: 'No se encontraron eventos de cumpleaños en el enlace de iCloud proporcionado.',
      };
    }

    // Fetch user's WhatsApp contacts for cross-referencing
    const instanceName = `autocumple-${userId}`;
    let waContacts: WhatsAppChatContact[] = [];
    try {
      waContacts = await evolutionApi.fetchChats(instanceName);
    } catch {}

    const previews: SyncedContactPreview[] = [];

    for (const bday of rawBirthdays) {
      const match = findBestWhatsAppMatch(bday.name, waContacts, 40);
      const isAuto = match.confidence >= 65;

      previews.push({
        id: bday.id,
        name: bday.name,
        birthDay: bday.birthDay,
        birthMonth: bday.birthMonth,
        birthYear: bday.birthYear,
        source: 'apple_calendar',
        matchedPhone: match.suggestedPhone || '',
        matchedName: match.matchedContact?.name || '',
        matchedPushName: match.matchedContact?.pushName,
        matchScore: match.confidence,
        isAutoMatched: isAuto,
        selected: isAuto,
      });
    }

    previews.sort((a, b) => b.matchScore - a.matchScore);

    return {
      success: true,
      items: previews,
      availableWhatsAppContacts: waContacts,
    };
  } catch (error: any) {
    console.error('syncICloudCalendarAction error:', error);
    return {
      success: false,
      error: error.message || 'Error al sincronizar con Apple iCloud',
    };
  }
}

export async function batchApproveSyncedContacts(
  contactsToSave: Array<{
    name: string;
    phone: string;
    birthDay: number;
    birthMonth: number;
    birthYear: number | null;
    source: ContactSource;
  }>
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const userId = await getAuthenticatedUserId();
    const instanceName = `autocumple-${userId}`;

    if (!contactsToSave || contactsToSave.length === 0) {
      return { success: false, error: 'No hay contactos seleccionados para guardar.' };
    }

    let savedCount = 0;

    for (const contact of contactsToSave) {
      if (!contact.name || !contact.phone || !contact.birthDay || !contact.birthMonth) {
        continue; // Skip incomplete items
      }

      // Try fetching profile picture from WhatsApp CDN
      let profilePic: string | null = null;
      try {
        profilePic = await evolutionApi.fetchProfilePictureUrl(instanceName, contact.phone);
      } catch {}

      await dbCreateContact(userId, {
        name: contact.name.trim(),
        phone: contact.phone.trim(),
        birthDay: contact.birthDay,
        birthMonth: contact.birthMonth,
        birthYear: contact.birthYear ?? null,
        targetType: 'individual',
        profilePictureUrl: profilePic || undefined,
        mode: 'ai',
        aiRelationship: 'Amigo',
        aiTone: 'casual',
        autoSend: false, // Default to approval required for safety
        sendTimeStart: '09:30',
        sendTimeEnd: '11:45',
        isActive: true,
        source: contact.source,
      });

      savedCount++;
    }

    revalidatePath('/contacts');
    revalidatePath('/dashboard');

    return { success: true, count: savedCount };
  } catch (error: any) {
    console.error('batchApproveSyncedContacts error:', error);
    return { success: false, error: error.message || 'Error al guardar contactos' };
  }
}
