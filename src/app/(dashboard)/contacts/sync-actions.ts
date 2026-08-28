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
  birthYear: null;
  source: ContactSource;
  
  // WhatsApp Matching
  matchedPhone: string;
  matchedName: string;
  matchedPushName?: string;
  profilePictureUrl?: string | null;
  matchScore: number;
  isAutoMatched: boolean;
  selected: boolean;

  // On-the-fly Greeting Customization (for 1-by-1 Tinder deck)
  mode: 'ai' | 'manual';
  aiRelationship: string;
  aiTone: 'casual' | 'divertido' | 'formal' | 'emotivo';
  aiNotes: string;
  autoSend: boolean;
  sendTimeStart: string;
  sendTimeEnd: string;
  customMessage?: string;
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
      const matchedWa = match.matchedContact;

      previews.push({
        id: bday.id,
        name: bday.name,
        birthDay: bday.birthDay,
        birthMonth: bday.birthMonth,
        birthYear: null,
        source: 'google_calendar',
        matchedPhone: match.suggestedPhone || '',
        matchedName: matchedWa?.name || '',
        matchedPushName: matchedWa?.pushName,
        profilePictureUrl: matchedWa?.profilePictureUrl || null,
        matchScore: match.confidence,
        isAutoMatched: isAuto,
        selected: isAuto,

        // Defaults for card customization
        mode: 'ai',
        aiRelationship: 'Amigo',
        aiTone: 'casual',
        aiNotes: '',
        autoSend: false,
        sendTimeStart: '09:30',
        sendTimeEnd: '11:45',
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
      const matchedWa = match.matchedContact;

      previews.push({
        id: bday.id,
        name: bday.name,
        birthDay: bday.birthDay,
        birthMonth: bday.birthMonth,
        birthYear: null,
        source: 'apple_calendar',
        matchedPhone: match.suggestedPhone || '',
        matchedName: matchedWa?.name || '',
        matchedPushName: matchedWa?.pushName,
        profilePictureUrl: matchedWa?.profilePictureUrl || null,
        matchScore: match.confidence,
        isAutoMatched: isAuto,
        selected: isAuto,

        // Defaults for card customization
        mode: 'ai',
        aiRelationship: 'Amigo',
        aiTone: 'casual',
        aiNotes: '',
        autoSend: false,
        sendTimeStart: '09:30',
        sendTimeEnd: '11:45',
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

export async function saveSingleSyncedContactAction(contact: {
  name: string;
  phone: string;
  birthDay: number;
  birthMonth: number;
  birthYear?: number | null;
  source: ContactSource;
  profilePictureUrl?: string | null;
  mode: 'ai' | 'manual';
  aiRelationship: string;
  aiTone: 'casual' | 'divertido' | 'formal' | 'emotivo';
  aiNotes?: string;
  autoSend: boolean;
  sendTimeStart?: string;
  sendTimeEnd?: string;
  customMessage?: string;
}): Promise<{ success: boolean; contactId?: string; error?: string }> {
  try {
    const userId = await getAuthenticatedUserId();
    const instanceName = `autocumple-${userId}`;

    if (!contact.name || !contact.phone || !contact.birthDay || !contact.birthMonth) {
      return { success: false, error: 'Faltan datos obligatorios del contacto.' };
    }

    let profilePic = contact.profilePictureUrl || null;
    if (!profilePic && contact.phone) {
      try {
        profilePic = await evolutionApi.fetchProfilePictureUrl(instanceName, contact.phone);
      } catch {}
    }

    const created = await dbCreateContact(userId, {
      name: contact.name.trim(),
      phone: contact.phone.trim(),
      birthDay: contact.birthDay,
      birthMonth: contact.birthMonth,
      birthYear: null,
      targetType: 'individual',
      profilePictureUrl: profilePic || undefined,
      mode: contact.mode || 'ai',
      aiRelationship: contact.aiRelationship || 'Amigo',
      aiTone: contact.aiTone || 'casual',
      aiNotes: contact.aiNotes?.trim() || undefined,
      customMessage: contact.customMessage?.trim() || undefined,
      autoSend: contact.autoSend ?? false,
      sendTimeStart: contact.sendTimeStart || '09:30',
      sendTimeEnd: contact.sendTimeEnd || '11:45',
      isActive: true,
      source: contact.source,
    });

    revalidatePath('/contacts');
    revalidatePath('/dashboard');

    return { success: true, contactId: created };
  } catch (error: any) {
    console.error('saveSingleSyncedContactAction error:', error);
    return { success: false, error: error.message || 'Error al guardar contacto' };
  }
}

export async function batchApproveSyncedContacts(
  contactsToSave: Array<{
    name: string;
    phone: string;
    birthDay: number;
    birthMonth: number;
    birthYear?: number | null;
    source: ContactSource;
    profilePictureUrl?: string | null;
    mode?: 'ai' | 'manual';
    aiRelationship?: string;
    aiTone?: 'casual' | 'divertido' | 'formal' | 'emotivo';
    aiNotes?: string;
    autoSend?: boolean;
    sendTimeStart?: string;
    sendTimeEnd?: string;
    customMessage?: string;
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
        continue;
      }

      let profilePic = contact.profilePictureUrl || null;
      if (!profilePic) {
        try {
          profilePic = await evolutionApi.fetchProfilePictureUrl(instanceName, contact.phone);
        } catch {}
      }

      await dbCreateContact(userId, {
        name: contact.name.trim(),
        phone: contact.phone.trim(),
        birthDay: contact.birthDay,
        birthMonth: contact.birthMonth,
        birthYear: null,
        targetType: 'individual',
        profilePictureUrl: profilePic || undefined,
        mode: contact.mode || 'ai',
        aiRelationship: contact.aiRelationship || 'Amigo',
        aiTone: contact.aiTone || 'casual',
        aiNotes: contact.aiNotes?.trim() || undefined,
        customMessage: contact.customMessage?.trim() || undefined,
        autoSend: contact.autoSend ?? false,
        sendTimeStart: contact.sendTimeStart || '09:30',
        sendTimeEnd: contact.sendTimeEnd || '11:45',
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
