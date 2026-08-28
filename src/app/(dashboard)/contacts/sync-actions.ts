'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { adminAuth } from '@/lib/firebase/admin';
import { createContact as dbCreateContact } from '@/lib/firebase/firestore';
import { evolutionApi } from '@/lib/evolution-api/client';
import { fetchGoogleCalendarBirthdays } from '@/lib/integrations/google-calendar';
import { fetchICloudCalendarBirthdays } from '@/lib/integrations/icloud-calendar';
import { findBestWhatsAppMatch } from '@/lib/parsers/fuzzy-match';
import { WhatsAppChatContact, WhatsAppGroup, ContactSource, WishMode, AiTone, TargetType } from '@/types';

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
  rawSummary?: string;
  source: ContactSource;
  
  // WhatsApp Matching
  matchedPhone: string;
  matchedName: string;
  matchedPushName?: string;
  profilePictureUrl?: string | null;
  matchScore: number;
  isAutoMatched: boolean;

  // Target Destination
  targetType: TargetType;
  groupId?: string;
  groupName?: string;
  mentionInGroup?: boolean;

  // On-the-fly Greeting Customization
  mode: WishMode;
  templateId?: string;
  customMessage?: string;
  aiTone: AiTone;
  aiNotes: string;
  autoSend: boolean;
  sendTimeStart: string;
  sendTimeEnd: string;
}

export async function syncGoogleCalendarAction(accessToken: string): Promise<{
  success: boolean;
  items?: SyncedContactPreview[];
  availableWhatsAppContacts?: WhatsAppChatContact[];
  availableGroups?: WhatsAppGroup[];
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

    // Fetch user's WhatsApp contacts & groups in parallel
    const instanceName = `autocumple-${userId}`;
    let waContacts: WhatsAppChatContact[] = [];
    let waGroups: WhatsAppGroup[] = [];
    try {
      const [c, g] = await Promise.all([
        evolutionApi.fetchChats(instanceName),
        evolutionApi.fetchGroups(instanceName),
      ]);
      waContacts = c;
      waGroups = g;
    } catch {}

    const rawPreviews: SyncedContactPreview[] = [];

    for (const bday of rawBirthdays) {
      const match = findBestWhatsAppMatch(bday.name, waContacts, 40);
      const isAuto = match.confidence >= 65;
      const matchedWa = match.matchedContact;

      rawPreviews.push({
        id: bday.id,
        name: bday.name,
        birthDay: bday.birthDay,
        birthMonth: bday.birthMonth,
        birthYear: null,
        rawSummary: bday.rawSummary || bday.name,
        source: 'google_calendar',
        matchedPhone: match.suggestedPhone || '',
        matchedName: matchedWa?.name || '',
        matchedPushName: matchedWa?.pushName,
        profilePictureUrl: matchedWa?.profilePictureUrl || null,
        matchScore: match.confidence,
        isAutoMatched: isAuto,

        // Target Destination Default
        targetType: 'individual',
        groupId: undefined,
        groupName: undefined,
        mentionInGroup: true,

        // Greeting Defaults (Default to fixed message)
        mode: 'manual',
        aiTone: 'casual',
        aiNotes: '',
        templateId: '',
        customMessage: '¡Muchas felicidades {nombre}! 🎂🥳 Que pases un día genial y lo disfrutes al máximo.',
        autoSend: false,
        sendTimeStart: '09:30',
        sendTimeEnd: '11:45',
      });
    }

    // Sort by match score descending (most reliable on top)
    rawPreviews.sort((a, b) => b.matchScore - a.matchScore);

    // Fetch real WhatsApp profile picture URLs in parallel for matched contacts
    const previews = await Promise.all(
      rawPreviews.map(async item => {
        if (item.matchedPhone && !item.profilePictureUrl) {
          try {
            const pic = await evolutionApi.fetchProfilePictureUrl(instanceName, item.matchedPhone);
            if (pic) item.profilePictureUrl = pic;
          } catch {}
        }
        return item;
      })
    );

    return {
      success: true,
      items: previews,
      availableWhatsAppContacts: waContacts,
      availableGroups: waGroups,
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
  availableGroups?: WhatsAppGroup[];
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

    // Fetch user's WhatsApp contacts & groups in parallel
    const instanceName = `autocumple-${userId}`;
    let waContacts: WhatsAppChatContact[] = [];
    let waGroups: WhatsAppGroup[] = [];
    try {
      const [c, g] = await Promise.all([
        evolutionApi.fetchChats(instanceName),
        evolutionApi.fetchGroups(instanceName),
      ]);
      waContacts = c;
      waGroups = g;
    } catch {}

    const rawPreviews: SyncedContactPreview[] = [];

    for (const bday of rawBirthdays) {
      const match = findBestWhatsAppMatch(bday.name, waContacts, 40);
      const isAuto = match.confidence >= 65;
      const matchedWa = match.matchedContact;

      rawPreviews.push({
        id: bday.id,
        name: bday.name,
        birthDay: bday.birthDay,
        birthMonth: bday.birthMonth,
        birthYear: null,
        rawSummary: bday.rawSummary || bday.name,
        source: 'apple_calendar',
        matchedPhone: match.suggestedPhone || '',
        matchedName: matchedWa?.name || '',
        matchedPushName: matchedWa?.pushName,
        profilePictureUrl: matchedWa?.profilePictureUrl || null,
        matchScore: match.confidence,
        isAutoMatched: isAuto,

        // Target Destination Default
        targetType: 'individual',
        groupId: undefined,
        groupName: undefined,
        mentionInGroup: true,

        // Greeting Defaults (Default to fixed message)
        mode: 'manual',
        aiTone: 'casual',
        aiNotes: '',
        templateId: '',
        customMessage: '¡Muchas felicidades {nombre}! 🎂🥳 Que pases un día genial y lo disfrutes al máximo.',
        autoSend: false,
        sendTimeStart: '09:30',
        sendTimeEnd: '11:45',
      });
    }

    rawPreviews.sort((a, b) => b.matchScore - a.matchScore);

    // Fetch real WhatsApp profile pictures in parallel
    const previews = await Promise.all(
      rawPreviews.map(async item => {
        if (item.matchedPhone && !item.profilePictureUrl) {
          try {
            const pic = await evolutionApi.fetchProfilePictureUrl(instanceName, item.matchedPhone);
            if (pic) item.profilePictureUrl = pic;
          } catch {}
        }
        return item;
      })
    );

    return {
      success: true,
      items: previews,
      availableWhatsAppContacts: waContacts,
      availableGroups: waGroups,
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
  targetType?: TargetType;
  groupId?: string;
  groupName?: string;
  mentionInGroup?: boolean;
  mode: WishMode;
  templateId?: string;
  customMessage?: string;
  aiTone: AiTone;
  aiNotes?: string;
  autoSend: boolean;
  sendTimeStart?: string;
  sendTimeEnd?: string;
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

    const createdId = await dbCreateContact(userId, {
      name: contact.name.trim(),
      phone: contact.phone.trim(),
      birthDay: contact.birthDay,
      birthMonth: contact.birthMonth,
      birthYear: null,
      targetType: contact.targetType || 'individual',
      groupId: contact.targetType === 'group' ? contact.groupId : undefined,
      groupName: contact.targetType === 'group' ? contact.groupName : undefined,
      mentionInGroup: contact.targetType === 'group' ? (contact.mentionInGroup ?? true) : undefined,
      profilePictureUrl: profilePic || undefined,
      mode: contact.mode || 'manual',
      templateId: contact.mode === 'template' ? contact.templateId : undefined,
      customMessage: contact.mode === 'manual' ? contact.customMessage?.trim() : undefined,
      aiTone: contact.mode === 'ai' ? contact.aiTone || 'casual' : undefined,
      aiNotes: contact.mode === 'ai' ? contact.aiNotes?.trim() || undefined : undefined,
      autoSend: contact.autoSend ?? false,
      sendTimeStart: contact.sendTimeStart || '09:30',
      sendTimeEnd: contact.sendTimeEnd || '11:45',
      isActive: true,
      source: contact.source,
    });

    revalidatePath('/contacts');
    revalidatePath('/dashboard');

    return { success: true, contactId: createdId };
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
    targetType?: TargetType;
    groupId?: string;
    groupName?: string;
    mentionInGroup?: boolean;
    mode?: WishMode;
    templateId?: string;
    customMessage?: string;
    aiTone?: AiTone;
    aiNotes?: string;
    autoSend?: boolean;
    sendTimeStart?: string;
    sendTimeEnd?: string;
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
        targetType: contact.targetType || 'individual',
        groupId: contact.targetType === 'group' ? contact.groupId : undefined,
        groupName: contact.targetType === 'group' ? contact.groupName : undefined,
        mentionInGroup: contact.targetType === 'group' ? (contact.mentionInGroup ?? true) : undefined,
        profilePictureUrl: profilePic || undefined,
        mode: contact.mode || 'manual',
        templateId: contact.mode === 'template' ? contact.templateId : undefined,
        customMessage: contact.mode === 'manual' ? contact.customMessage?.trim() : undefined,
        aiTone: contact.mode === 'ai' ? contact.aiTone || 'casual' : undefined,
        aiNotes: contact.mode === 'ai' ? contact.aiNotes?.trim() || undefined : undefined,
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

export async function getWhatsAppProfilePicAction(phone: string): Promise<string | null> {
  try {
    const userId = await getAuthenticatedUserId();
    const instanceName = `autocumple-${userId}`;
    return await evolutionApi.fetchProfilePictureUrl(instanceName, phone);
  } catch {
    return null;
  }
}
