'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { adminAuth } from '@/lib/firebase/admin';
import { createContact as dbCreateContact } from '@/lib/firebase/firestore';
import { evolutionApi } from '@/lib/evolution-api/client';
import { fetchGoogleCalendarBirthdays } from '@/lib/integrations/google-calendar';
import { fetchICloudCalendarBirthdays } from '@/lib/integrations/icloud-calendar';
import { matchAllBirthdaysToWhatsApp1to1 } from '@/lib/parsers/fuzzy-match';
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
  aiNotes?: string;
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

    // Fetch user's WhatsApp contacts & groups in parallel with full cache + live merge
    const instanceName = `autocumple-${userId}`;
    let waContacts: WhatsAppChatContact[] = [];
    let waGroups: WhatsAppGroup[] = [];
    try {
      const { getCachedWhatsAppContacts, prewarmWhatsAppContactsCache } = await import('@/lib/whatsapp/sync-cache');
      const [c, g, cached] = await Promise.all([
        evolutionApi.fetchChats(instanceName, true),
        evolutionApi.fetchGroups(instanceName),
        getCachedWhatsAppContacts(userId).catch(() => []),
      ]);

      const contactMap = new Map<string, WhatsAppChatContact>();
      for (const item of (c || [])) {
        const p = (item.phone || '').replace(/\D/g, '');
        if (p) contactMap.set(p, item);
      }
      for (const item of (cached || [])) {
        const p = (item.phone || '').replace(/\D/g, '');
        if (p && !contactMap.has(p)) {
          contactMap.set(p, {
            jid: `${p}@s.whatsapp.net`,
            phone: `+${p}`,
            name: item.name,
            pushName: item.pushName,
            profilePictureUrl: item.profilePictureUrl || null,
          });
        }
      }
      waContacts = Array.from(contactMap.values());
      waGroups = g;

      if (cached.length === 0) {
        prewarmWhatsAppContactsCache(userId).catch(() => {});
      }
    } catch {}

    // Strict 1-to-1 unique match assignment (threshold 50%)
    const MIN_MATCH_THRESHOLD = 50;
    const matches = matchAllBirthdaysToWhatsApp1to1(rawBirthdays, waContacts, MIN_MATCH_THRESHOLD);

    const rawPreviews: SyncedContactPreview[] = matches.map(m => {
      const bday = m.birthday;
      const matchedWa = m.matchedContact;
      const cleanPhone = matchedWa ? (matchedWa.phone || matchedWa.jid || '').replace(/\D/g, '') : '';
      const isAutoMatched = Boolean(matchedWa && m.confidence >= MIN_MATCH_THRESHOLD);

      return {
        id: bday.id,
        name: bday.name,
        birthDay: bday.birthDay,
        birthMonth: bday.birthMonth,
        birthYear: null,
        rawSummary: bday.rawSummary || bday.name,
        source: 'google_calendar',
        matchedPhone: cleanPhone,
        matchedName: matchedWa?.name || bday.name,
        matchedPushName: matchedWa?.pushName,
        profilePictureUrl: matchedWa?.profilePictureUrl || null,
        matchScore: m.confidence,
        isAutoMatched,

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
      };
    });

    // Sort by upcoming birthday from today forward (soonest first)
    rawPreviews.sort((a, b) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const year = today.getFullYear();

      const nextA = new Date(year, a.birthMonth - 1, a.birthDay);
      if (nextA < today) nextA.setFullYear(year + 1);

      const nextB = new Date(year, b.birthMonth - 1, b.birthDay);
      if (nextB < today) nextB.setFullYear(year + 1);

      return nextA.getTime() - nextB.getTime();
    });

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

    // Fetch user's WhatsApp contacts & groups in parallel with full cache + live merge
    const instanceName = `autocumple-${userId}`;
    let waContacts: WhatsAppChatContact[] = [];
    let waGroups: WhatsAppGroup[] = [];
    try {
      const { getCachedWhatsAppContacts, prewarmWhatsAppContactsCache } = await import('@/lib/whatsapp/sync-cache');
      const [c, g, cached] = await Promise.all([
        evolutionApi.fetchChats(instanceName, true),
        evolutionApi.fetchGroups(instanceName),
        getCachedWhatsAppContacts(userId).catch(() => []),
      ]);

      const contactMap = new Map<string, WhatsAppChatContact>();
      for (const item of (c || [])) {
        const p = (item.phone || '').replace(/\D/g, '');
        if (p) contactMap.set(p, item);
      }
      for (const item of (cached || [])) {
        const p = (item.phone || '').replace(/\D/g, '');
        if (p && !contactMap.has(p)) {
          contactMap.set(p, {
            jid: `${p}@s.whatsapp.net`,
            phone: `+${p}`,
            name: item.name,
            pushName: item.pushName,
            profilePictureUrl: item.profilePictureUrl || null,
          });
        }
      }
      waContacts = Array.from(contactMap.values());
      waGroups = g;

      if (cached.length === 0) {
        prewarmWhatsAppContactsCache(userId).catch(() => {});
      }
    } catch {}

    // Strict 1-to-1 unique match assignment (threshold 50%)
    const MIN_MATCH_THRESHOLD = 50;
    const matches = matchAllBirthdaysToWhatsApp1to1(rawBirthdays, waContacts, MIN_MATCH_THRESHOLD);

    const rawPreviews: SyncedContactPreview[] = matches.map(m => {
      const bday = m.birthday;
      const matchedWa = m.matchedContact;
      const cleanPhone = matchedWa ? (matchedWa.phone || matchedWa.jid || '').replace(/\D/g, '') : '';
      const isAutoMatched = Boolean(matchedWa && m.confidence >= MIN_MATCH_THRESHOLD);

      return {
        id: bday.id,
        name: bday.name,
        birthDay: bday.birthDay,
        birthMonth: bday.birthMonth,
        birthYear: null,
        rawSummary: bday.rawSummary || bday.name,
        source: 'apple_calendar',
        matchedPhone: cleanPhone,
        matchedName: matchedWa?.name || bday.name,
        matchedPushName: matchedWa?.pushName,
        profilePictureUrl: matchedWa?.profilePictureUrl || null,
        matchScore: m.confidence,
        isAutoMatched,

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
      };
    });

    // Sort by upcoming birthday from today forward (soonest first)
    rawPreviews.sort((a, b) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const year = today.getFullYear();

      const nextA = new Date(year, a.birthMonth - 1, a.birthDay);
      if (nextA < today) nextA.setFullYear(year + 1);

      const nextB = new Date(year, b.birthMonth - 1, b.birthDay);
      if (nextB < today) nextB.setFullYear(year + 1);

      return nextA.getTime() - nextB.getTime();
    });

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
      birthYear: contact.birthYear || null,
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
        birthYear: contact.birthYear || null,
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

export interface WhatsAppSyncItem {
  id: string;
  name: string;
  phone: string;
  pushName?: string;
  profilePictureUrl?: string | null;
  
  // Birthday fields
  birthDay: number;
  birthMonth: number;
  birthYear?: number | null;
  
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
  aiNotes?: string;
  autoSend: boolean;
  sendTimeStart: string;
  sendTimeEnd: string;
}

export async function getWhatsAppInitialBatchForSyncAction(): Promise<{
  success: boolean;
  items?: WhatsAppSyncItem[];
  availableGroups?: WhatsAppGroup[];
  hasMore?: boolean;
  totalEstimated?: number;
  error?: string;
}> {
  try {
    const userId = await getAuthenticatedUserId();
    const instanceName = `autocumple-${userId}`;

    const { getContacts } = await import('@/lib/firebase/firestore');
    const { getCachedWhatsAppContacts, prewarmWhatsAppContactsCache } = await import('@/lib/whatsapp/sync-cache');

    // Trigger non-blocking background pre-warming
    prewarmWhatsAppContactsCache(userId).catch(() => {});

    // Fast parallel local Firestore fetch + cached groups
    const [cachedContacts, existingContacts, waGroups] = await Promise.all([
      getCachedWhatsAppContacts(userId).catch(() => []),
      getContacts(userId).catch(() => []),
      evolutionApi.fetchGroups(instanceName).catch(() => []),
    ]);

    const existingPhones = new Set(
      existingContacts.map(c => (c.phone || '').replace(/\D/g, ''))
    );

    if (cachedContacts.length > 0) {
      const EIGHTEEN_MONTHS = 18 * 30 * 24 * 60 * 60 * 1000;
      const cutoff = Date.now() - EIGHTEEN_MONTHS;

      const candidates = cachedContacts.filter(c => {
        if (existingPhones.has(c.phone)) return false;
        if ((c.lastActivity || 0) <= cutoff) return false;
        const hasName = Boolean(c.name && c.name.trim());
        const hasPic = Boolean(c.profilePictureUrl && c.profilePictureUrl.trim());
        return hasName || hasPic;
      });

      if (candidates.length === 0) {
        return {
          success: false,
          error: '¡Todos tus contactos de WhatsApp ya están guardados en tu agenda!',
        };
      }

      candidates.sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0));

      // Deliver initial batch of first 3 contacts — NO avatar prefetch, truly instant
      const initialCandidates = candidates.slice(0, 3);

      const items: WhatsAppSyncItem[] = initialCandidates.map((c, index) => ({
        id: `wa-sync-${c.phone}-${index}`,
        name: c.name,
        phone: c.phone,
        pushName: c.pushName,
        profilePictureUrl: c.profilePictureUrl || null,
        birthDay: 0,
        birthMonth: 0,
        birthYear: null,
        targetType: 'individual',
        groupId: undefined,
        groupName: undefined,
        mentionInGroup: true,
        mode: 'manual',
        templateId: undefined,
        customMessage: undefined,
        aiTone: 'casual',
        aiNotes: undefined,
        autoSend: false,
        sendTimeStart: '09:00',
        sendTimeEnd: '11:00',
      }));

      return {
        success: true,
        items,
        availableGroups: waGroups,
        hasMore: candidates.length > 3,
        totalEstimated: candidates.length,
      };
    }

    // Ultra-fast live fallback if cache not yet populated: fetch first 3 chats slice (< 80ms)
    const [fastSlice, fallbackGroups] = await Promise.all([
      evolutionApi.fetchFastChatSlice(instanceName, 5).catch(() => []),
      evolutionApi.fetchGroups(instanceName).catch(() => []),
    ]);

    const initialCandidates = fastSlice
      .filter(c => {
        const p = (c.phone || '').replace(/\D/g, '');
        return p && !existingPhones.has(p) && c.name && !c.name.startsWith('Contacto (+');
      })
      .slice(0, 3);

    if (initialCandidates.length === 0) {
      return {
        success: false,
        error: 'No se encontraron conversaciones con nombre en tu WhatsApp.',
      };
    }

    const items: WhatsAppSyncItem[] = initialCandidates.map((c, index) => ({
      id: `wa-sync-${c.phone}-${index}`,
      name: c.name,
      phone: (c.phone || '').replace(/\D/g, ''),
      pushName: c.pushName,
      profilePictureUrl: c.profilePictureUrl || null,
      birthDay: 0,
      birthMonth: 0,
      birthYear: null,
      targetType: 'individual',
      groupId: undefined,
      groupName: undefined,
      mentionInGroup: true,
      mode: 'manual',
      templateId: undefined,
      customMessage: undefined,
      aiTone: 'casual',
      aiNotes: undefined,
      autoSend: false,
      sendTimeStart: '09:00',
      sendTimeEnd: '11:00',
    }));

    return {
      success: true,
      items,
      availableGroups: fallbackGroups.length > 0 ? fallbackGroups : waGroups,
      hasMore: true,
    };
  } catch (error: any) {
    console.error('getWhatsAppInitialBatchForSyncAction error:', error);
    return {
      success: false,
      error: error.message || 'Error al conectar con WhatsApp',
    };
  }
}

export async function getWhatsAppChunkedContactsForSyncAction(
  alreadyLoadedPhones: string[] = [],
  _offset: number = 0,
  limit: number = 25
): Promise<{
  success: boolean;
  items?: WhatsAppSyncItem[];
  availableGroups?: WhatsAppGroup[];
  hasMore?: boolean;
  totalEstimated?: number;
  error?: string;
}> {
  try {
    const userId = await getAuthenticatedUserId();

    const { getContacts } = await import('@/lib/firebase/firestore');
    const { getCachedWhatsAppContacts } = await import('@/lib/whatsapp/sync-cache');

    // Build exclusion set: already loaded phones + already saved contacts
    const loadedSet = new Set(alreadyLoadedPhones.map(p => (p || '').replace(/\D/g, '')));
    const existingContacts = await getContacts(userId).catch(() => []);
    existingContacts.forEach(c => loadedSet.add((c.phone || '').replace(/\D/g, '')));

    // Read ONLY from Firestore cache — no VPS calls, instant (<30ms)
    const cached = await getCachedWhatsAppContacts(userId).catch(() => []);

    const EIGHTEEN_MONTHS = 18 * 30 * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - EIGHTEEN_MONTHS;

    // Include all chats with activity in last 18 months
    const remaining = cached.filter(c => {
      const p = (c.phone || '').replace(/\D/g, '');
      if (!p || loadedSet.has(p)) return false;
      if (!c.lastActivity || c.lastActivity < cutoff) return false;
      return true;
    });

    if (remaining.length === 0) {
      return { success: true, items: [], availableGroups: [], hasMore: false, totalEstimated: 0 };
    }

    // Sort PURELY by most recent conversation timestamp descending
    remaining.sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0));

    // Take next chunk (offset is ignored since we filter by alreadyLoadedPhones)
    const chunkSlice = remaining.slice(0, limit);

    const items: WhatsAppSyncItem[] = chunkSlice.map((c, index) => ({
      id: `wa-sync-${c.phone}-chunk-${index}`,
      name: c.name,
      phone: c.phone,
      pushName: c.pushName,
      profilePictureUrl: c.profilePictureUrl || null,
      birthDay: 0,
      birthMonth: 0,
      birthYear: null,
      targetType: 'individual',
      groupId: undefined,
      groupName: undefined,
      mentionInGroup: true,
      mode: 'manual',
      templateId: undefined,
      customMessage: undefined,
      aiTone: 'casual',
      aiNotes: undefined,
      autoSend: false,
      sendTimeStart: '09:00',
      sendTimeEnd: '11:00',
    }));

    const instanceName = `autocumple-${userId}`;
    const waGroups = await evolutionApi.fetchGroups(instanceName).catch(() => []);

    return {
      success: true,
      items,
      availableGroups: waGroups,
      hasMore: remaining.length > limit,
      totalEstimated: remaining.length,
    };
  } catch (error: any) {
    console.error('getWhatsAppChunkedContactsForSyncAction error:', error);
    return {
      success: false,
      error: error.message || 'Error al obtener bloque de contactos',
    };
  }
}

export async function getWhatsAppRemainingContactsForSyncAction(alreadyLoadedPhones: string[] = []): Promise<{
  success: boolean;
  items?: WhatsAppSyncItem[];
  availableGroups?: WhatsAppGroup[];
  error?: string;
}> {
  try {
    const userId = await getAuthenticatedUserId();

    const { getContacts } = await import('@/lib/firebase/firestore');
    const { getCachedWhatsAppContacts } = await import('@/lib/whatsapp/sync-cache');

    const loadedSet = new Set(alreadyLoadedPhones.map(p => (p || '').replace(/\D/g, '')));
    const existingContacts = await getContacts(userId).catch(() => []);
    existingContacts.forEach(c => loadedSet.add((c.phone || '').replace(/\D/g, '')));

    // Read ONLY from Firestore cache — no VPS calls
    const cached = await getCachedWhatsAppContacts(userId).catch(() => []);

    const EIGHTEEN_MONTHS = 18 * 30 * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - EIGHTEEN_MONTHS;

    // Include all chats with activity in last 18 months
    const remaining = cached.filter(c => {
      const p = (c.phone || '').replace(/\D/g, '');
      if (!p || loadedSet.has(p)) return false;
      if (!c.lastActivity || c.lastActivity < cutoff) return false;
      return true;
    });

    if (remaining.length === 0) {
      return { success: true, items: [], availableGroups: [] };
    }

    // Sort purely by most recent conversation
    remaining.sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0));

    const items: WhatsAppSyncItem[] = remaining.map((c, index) => ({
      id: `wa-sync-${c.phone}-bg-${index}`,
      name: c.name,
      phone: c.phone,
      pushName: c.pushName,
      profilePictureUrl: c.profilePictureUrl || null,
      birthDay: 0,
      birthMonth: 0,
      birthYear: null,
      targetType: 'individual',
      groupId: undefined,
      groupName: undefined,
      mentionInGroup: true,
      mode: 'manual',
      templateId: undefined,
      customMessage: undefined,
      aiTone: 'casual',
      aiNotes: undefined,
      autoSend: false,
      sendTimeStart: '09:00',
      sendTimeEnd: '11:00',
    }));

    return {
      success: true,
      items,
      availableGroups: [],
    };
  } catch (error: any) {
    console.error('getWhatsAppRemainingContactsForSyncAction error:', error);
    return {
      success: false,
      error: error.message || 'Error al obtener contactos restantes',
    };
  }
}

export async function getWhatsAppRecentChatsForSyncAction(): Promise<{
  success: boolean;
  items?: WhatsAppSyncItem[];
  availableGroups?: WhatsAppGroup[];
  error?: string;
}> {
  try {
    const userId = await getAuthenticatedUserId();
    const instanceName = `autocumple-${userId}`;

    // Verify WhatsApp connection in Evolution API
    const evoState = await evolutionApi.getConnectionState(instanceName);
    if (evoState.instance?.state !== 'open') {
      return {
        success: false,
        error: 'Tu WhatsApp no está conectado. Por favor, vincula tu cuenta de WhatsApp primero en la sección de WhatsApp.',
      };
    }

    const { getContacts } = await import('@/lib/firebase/firestore');
    const { getCachedWhatsAppContacts, prewarmWhatsAppContactsCache } = await import('@/lib/whatsapp/sync-cache');

    // Check if we have pre-warmed cached contacts in Firestore
    const [cachedContacts, rawGroups, existingContacts] = await Promise.all([
      getCachedWhatsAppContacts(userId).catch(() => []),
      evolutionApi.fetchAllGroupsWithParticipants(instanceName).catch(() => []),
      getContacts(userId).catch(() => []),
    ]);

    // Set of existing clean phone numbers to avoid showing already added contacts
    const existingPhones = new Set(
      existingContacts.map(c => (c.phone || '').replace(/\D/g, ''))
    );

    // Build groups list for dropdown
    const groupsList: WhatsAppGroup[] = (rawGroups || []).map((g: any) => ({
      id: g.id || g.jid,
      subject: g.subject || g.name || 'Grupo de WhatsApp',
      pictureUrl: g.pictureUrl || null,
      size: g.size || (g.participants ? g.participants.length : 0),
    }));

    // If we have cached contacts, return them immediately (0ms instant load with HD photos!)
    if (cachedContacts.length > 0) {
      const candidates = cachedContacts.filter(c => !existingPhones.has(c.phone));
      
      // Trigger background cache refresh if needed
      prewarmWhatsAppContactsCache(userId).catch(() => {});

      if (candidates.length === 0) {
        return {
          success: false,
          error: '¡Todos tus contactos de WhatsApp ya están guardados en tu agenda!',
        };
      }

      // Sort purely by most recent conversation timestamp descending
      candidates.sort((a, b) => b.lastActivity - a.lastActivity);

      const items: WhatsAppSyncItem[] = candidates.map((c, index) => ({
        id: `wa-sync-${c.phone}-${index}`,
        name: c.name,
        phone: c.phone,
        pushName: c.pushName,
        profilePictureUrl: c.profilePictureUrl || null,
        birthDay: 0,
        birthMonth: 0,
        birthYear: null,
        targetType: 'individual',
        groupId: undefined,
        groupName: undefined,
        mentionInGroup: true,
        mode: 'manual',
        templateId: undefined,
        customMessage: undefined,
        aiTone: 'casual',
        aiNotes: undefined,
        autoSend: false,
        sendTimeStart: '09:00',
        sendTimeEnd: '11:00',
      }));

      return {
        success: true,
        items,
        availableGroups: groupsList,
      };
    }

    // Fallback: Live fetch if cache is being initialized for the very first time
    const [rawChats, rawMessages] = await Promise.all([
      evolutionApi.fetchChats(instanceName, true).catch(() => []),
      evolutionApi.fetchMessagesBatch(instanceName, 5).catch(() => []),
    ]);

    // Trigger background cache prewarming
    prewarmWhatsAppContactsCache(userId).catch(() => {});

    const isInvalidName = (name?: string | null): boolean => {
      if (!name) return true;
      const clean = name.trim().toLowerCase();
      if (!clean) return true;
      if (clean === 'você' || clean === 'voce' || clean === 'you') return true;
      if (clean === 'whatsapp' || clean === 'desconocido') return true;
      if (/^[\d+\s\-()]+$/.test(clean)) return true;
      return false;
    };

    // 1. Build pushName resolution map from message history (1-on-1 chats and group messages)
    const nameMap = new Map<string, string>();
    for (const m of (rawMessages || [])) {
      const sender = m.key?.participant || (!m.key?.fromMe ? m.key?.remoteJid : '') || '';
      const name = m.pushName;
      if (sender && sender.endsWith('@s.whatsapp.net') && !isInvalidName(name)) {
        const phone = sender.replace(/@.*$/, '').replace(/\D/g, '');
        const cleanName = (name as string).trim();
        if (!nameMap.has(phone)) {
          nameMap.set(phone, cleanName);
        }
      }
    }

    // 2. Build consolidated map of contacts
    interface CandidateContact {
      phone: string;
      name: string;
      pushName?: string;
      profilePictureUrl?: string | null;
      lastActivity: number;
      hasRealName: boolean;
      groupContext?: string;
    }

    const contactMap = new Map<string, CandidateContact>();

    // A. Add individual 1-on-1 chats
    for (const rawC of (rawChats || [])) {
      const c = rawC as any;
      const cleanPhone = (c.phone || c.jid || c.remoteJid || '').replace(/\D/g, '');
      if (!cleanPhone || cleanPhone.length < 6 || existingPhones.has(cleanPhone)) continue;

      let name: string | undefined = c.name;
      if (isInvalidName(name)) {
        name = c.pushName;
      }
      if (isInvalidName(name)) {
        name = c.lastMessage?.pushName;
      }
      if (isInvalidName(name)) {
        name = nameMap.get(cleanPhone);
      }

      const hasRealName = Boolean(name && !isInvalidName(name));
      const displayName = hasRealName ? (name as string).trim() : '';
      const time = c.lastMessage?.messageTimestamp 
        ? c.lastMessage.messageTimestamp * 1000 
        : (c.updatedAt ? new Date(c.updatedAt).getTime() : 0);

      contactMap.set(cleanPhone, {
        phone: cleanPhone,
        name: displayName,
        pushName: c.pushName && !isInvalidName(c.pushName) ? c.pushName : nameMap.get(cleanPhone),
        profilePictureUrl: c.profilePictureUrl || null,
        lastActivity: time,
        hasRealName,
      });
    }

    // B. Extract and add group participants
    for (const g of (rawGroups || [])) {
      const gSubject = g.subject || g.name || 'Grupo de WhatsApp';

      for (const p of (g.participants || [])) {
        const rawPhone = p.phoneNumber || p.id || '';
        const cleanPhone = rawPhone.replace(/@.*$/, '').replace(/\D/g, '');
        if (!cleanPhone || cleanPhone.length < 5 || existingPhones.has(cleanPhone)) continue;

        const resolvedName = nameMap.get(cleanPhone);

        if (contactMap.has(cleanPhone)) {
          const existing = contactMap.get(cleanPhone)!;
          if (!existing.hasRealName && resolvedName) {
            existing.name = resolvedName;
            existing.hasRealName = true;
          }
        } else if (resolvedName && !isInvalidName(resolvedName)) {
          const cleanName = resolvedName.trim();
          contactMap.set(cleanPhone, {
            phone: cleanPhone,
            name: cleanName,
            pushName: cleanName,
            profilePictureUrl: null,
            lastActivity: 0,
            hasRealName: true,
            groupContext: gSubject,
          });
        }
      }
    }

    const allCandidates = Array.from(contactMap.values());

    if (allCandidates.length === 0) {
      if (existingContacts.length > 0) {
        return {
          success: false,
          error: '¡Todos tus contactos y participantes de WhatsApp ya están guardados en tu agenda!',
        };
      }
      return {
        success: false,
        error: 'No se encontraron conversaciones ni participantes en tu WhatsApp.',
      };
    }

    // Sort purely by most recent activity timestamp
    allCandidates.sort((a, b) => b.lastActivity - a.lastActivity);

    // Prefetch real WhatsApp profile picture URLs in parallel for the first 60 contacts
    const firstBatchSize = Math.min(60, allCandidates.length);
    const prefetchedPics = await Promise.all(
      allCandidates.slice(0, firstBatchSize).map(async c => {
        try {
          const pic = await evolutionApi.fetchProfilePictureUrl(instanceName, c.phone);
          return { phone: c.phone, pic };
        } catch {
          return { phone: c.phone, pic: null };
        }
      })
    );

    const picMap = new Map<string, string | null>();
    prefetchedPics.forEach(item => {
      if (item.pic) picMap.set(item.phone, item.pic);
    });

    const items: WhatsAppSyncItem[] = allCandidates.map((c, index) => {
      return {
        id: `wa-sync-${c.phone}-${index}`,
        name: c.name,
        phone: c.phone,
        pushName: c.pushName,
        profilePictureUrl: picMap.get(c.phone) || c.profilePictureUrl || null,
        birthDay: 0,
        birthMonth: 0,
        birthYear: null,
        targetType: 'individual',
        groupId: undefined,
        groupName: undefined,
        mentionInGroup: true,
        mode: 'manual',
        aiTone: 'casual',
        aiNotes: '',
        templateId: '',
        customMessage: '¡Muchas felicidades {nombre}! 🎂🥳 Que pases un día genial y lo disfrutes al máximo.',
        autoSend: false,
        sendTimeStart: '09:30',
        sendTimeEnd: '11:45',
      };
    });

    return {
      success: true,
      items,
      availableGroups: groupsList.length > 0 ? groupsList : undefined,
    };
  } catch (error: any) {
    console.error('getWhatsAppRecentChatsForSyncAction error:', error);
    return {
      success: false,
      error: error.message || 'Error al obtener conversaciones de WhatsApp',
    };
  }
}
