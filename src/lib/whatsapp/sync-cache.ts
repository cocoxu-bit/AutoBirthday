import { adminDb } from '@/lib/firebase/admin';
import { evolutionApi } from '@/lib/evolution-api/client';
import { Timestamp } from 'firebase-admin/firestore';

export interface CachedWhatsAppContact {
  phone: string;
  name: string;
  pushName?: string;
  profilePictureUrl?: string | null;
  hasRealName: boolean;
  source: 'chat' | 'group_participant';
  groupContext?: string;
  lastActivity: number;
  updatedAt: Timestamp;
}

const isInvalidName = (name?: string | null): boolean => {
  if (!name) return true;
  const clean = name.trim().toLowerCase();
  if (!clean) return true;
  if (clean === 'você' || clean === 'voce' || clean === 'you') return true;
  if (clean === 'whatsapp' || clean === 'desconocido') return true;
  if (/^[\d+\s\-()]+$/.test(clean)) return true;
  return false;
};

function extractRealChatTimestamp(chat: any): number {
  if (!chat) return 0;
  let best = 0;
  const candidates = [
    chat.lastMessage?.messageTimestamp,
    chat.conversationTimestamp,
    chat.lastMessage?.message?.messageTimestamp,
    chat.timestamp,
    chat.lastMessageTimestamp,
    chat.lastActivity,
  ];
  for (const raw of candidates) {
    if (!raw) continue;
    let num = typeof raw === 'number' ? raw : Number(raw);
    if (!isNaN(num) && num > 0) {
      if (num < 1e12 && num > 1e8) num = num * 1000;
      if (num <= Date.now() + 86400000 && num > best) best = num;
    }
  }
  return best;
}

/**
 * Pre-warms and caches WhatsApp contacts, pushNames, and HD profile photos
 * directly in Firestore right when the user connects their WhatsApp account.
 */
/**
 * Pre-warms and caches WhatsApp contacts in two intelligent stages:
 * Stage 1: Ultra-fast top 10 chats written to Firestore in <500ms.
 * Stage 2: Comprehensive background sync with group participants and HD photos.
 */
export async function prewarmWhatsAppContactsCache(userId: string): Promise<void> {
  const instanceName = `autocumple-${userId}`;

  try {
    const evoState = await evolutionApi.getConnectionState(instanceName).catch(() => null);
    if (evoState?.instance?.state !== 'open') {
      return;
    }

    const collectionRef = adminDb.collection('users').doc(userId).collection('wa_contacts_cache');

    // -------------------------------------------------------------
    // STAGE 1: IMMEDIATE FAST PRE-WARM (Top 10 chats in < 500ms with HD Photos)
    // -------------------------------------------------------------
    const fastChats = await evolutionApi.fetchChats(instanceName, false).catch(() => []);
    if (fastChats && fastChats.length > 0) {
      const topItems = fastChats.slice(0, 10);
      
      // Parallel avatar resolution for top chats
      await Promise.all(
        topItems.map(async (rawC: any) => {
          const cleanPhone = (rawC.phone || rawC.jid || rawC.remoteJid || '').replace(/\D/g, '');
          if (cleanPhone && !rawC.profilePictureUrl) {
            try {
              const pic = await evolutionApi.fetchProfilePictureUrl(instanceName, cleanPhone);
              if (pic) rawC.profilePictureUrl = pic;
            } catch {}
          }
        })
      );

      const topBatch = adminDb.batch();
      let topCount = 0;

      for (const rawC of topItems) {
        const c = rawC as any;
        const cleanPhone = (c.phone || c.jid || c.remoteJid || '').replace(/\D/g, '');
        if (!cleanPhone || cleanPhone.length < 6) continue;

        let name: string | undefined = c.name;
        if (isInvalidName(name)) name = c.pushName;
        if (isInvalidName(name)) name = c.lastMessage?.pushName;

        const hasRealName = Boolean(name && !isInvalidName(name));
        
        // SKIP nameless contacts — never write "Contacto (+XXXX)" to cache
        if (!hasRealName) continue;
        
        const displayName = (name as string).trim();
        const time = extractRealChatTimestamp(c);

        const docRef = collectionRef.doc(cleanPhone);
        topBatch.set(docRef, {
          phone: cleanPhone,
          name: displayName,
          pushName: c.pushName && !isInvalidName(c.pushName) ? c.pushName : undefined,
          profilePictureUrl: c.profilePictureUrl || null,
          hasRealName: true,
          source: 'chat',
          lastActivity: time,
          updatedAt: Timestamp.now(),
        }, { merge: true });

        topCount++;
      }

      if (topCount > 0) {
        await topBatch.commit();
      }
    }

    // -------------------------------------------------------------
    // STAGE 2: DEEP BACKGROUND DISCOVERY (Messages, Groups, HD Photos)
    // -------------------------------------------------------------
    const [rawChats, rawGroups, rawMessages] = await Promise.all([
      evolutionApi.fetchChats(instanceName, true).catch(() => []),
      evolutionApi.fetchAllGroupsWithParticipants(instanceName).catch(() => []),
      evolutionApi.fetchMessagesBatch(instanceName, 5).catch(() => []),
    ]);

    // 1. Build pushName resolution map from message history
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

    // 2. Build candidate contacts pool — ONLY contacts with real names
    const contactMap = new Map<string, Omit<CachedWhatsAppContact, 'updatedAt'>>();

    // A. 1-on-1 chats
    for (const rawC of (rawChats || [])) {
      const c = rawC as any;
      const cleanPhone = (c.phone || c.jid || c.remoteJid || '').replace(/\D/g, '');
      if (!cleanPhone || cleanPhone.length < 6) continue;

      let name: string | undefined = c.name;
      if (isInvalidName(name)) name = c.pushName;
      if (isInvalidName(name)) name = c.lastMessage?.pushName;
      if (isInvalidName(name)) name = nameMap.get(cleanPhone);

      const hasRealName = Boolean(name && !isInvalidName(name));
      
      // SKIP nameless contacts — never write "Contacto (+XXXX)" to cache
      if (!hasRealName) continue;
      
      const displayName = (name as string).trim();
      const time = extractRealChatTimestamp(c);

      contactMap.set(cleanPhone, {
        phone: cleanPhone,
        name: displayName,
        pushName: c.pushName && !isInvalidName(c.pushName) ? c.pushName : nameMap.get(cleanPhone),
        profilePictureUrl: c.profilePictureUrl || null,
        hasRealName: true,
        source: 'chat',
        lastActivity: time,
      });
    }

    // B. Group participants — only add if they have a resolved name AND an existing chat
    for (const g of (rawGroups || [])) {
      for (const p of (g.participants || [])) {
        const rawPhone = p.phoneNumber || p.id || '';
        const cleanPhone = rawPhone.replace(/@.*$/, '').replace(/\D/g, '');
        if (!cleanPhone || cleanPhone.length < 6) continue;

        const resolvedName = nameMap.get(cleanPhone);
        if (contactMap.has(cleanPhone)) {
          // Upgrade existing chat entry name if needed
          const existing = contactMap.get(cleanPhone)!;
          if (!existing.hasRealName && resolvedName) {
            existing.name = resolvedName;
            existing.hasRealName = true;
          }
        }
        // NOTE: Do NOT add group-only participants (no chat = no lastActivity = wrong order)
      }
    }

    const allCandidates = Array.from(contactMap.values());
    if (allCandidates.length === 0) return;

    // Sort PURELY by most recent conversation timestamp — no hasRealName priority
    allCandidates.sort((a, b) => b.lastActivity - a.lastActivity);

    // 3. Batch fetch real profile photos in chunks of 10
    const photosToFetch = allCandidates.slice(0, 100);
    const CHUNK_SIZE = 10;
    
    for (let i = 0; i < photosToFetch.length; i += CHUNK_SIZE) {
      const chunk = photosToFetch.slice(i, i + CHUNK_SIZE);
      await Promise.all(chunk.map(async c => {
        if (!c.profilePictureUrl) {
          try {
            const pic = await evolutionApi.fetchProfilePictureUrl(instanceName, c.phone);
            if (pic) c.profilePictureUrl = pic;
          } catch {}
        }
      }));
    }

    // 4. Batch write to Firestore cache in chunks of 450 (Firestore limit is 500)
    const BATCH_LIMIT = 450;
    for (let i = 0; i < allCandidates.length; i += BATCH_LIMIT) {
      const batchChunk = allCandidates.slice(i, i + BATCH_LIMIT);
      const batch = adminDb.batch();
      for (const contact of batchChunk) {
        const docRef = collectionRef.doc(contact.phone);
        batch.set(docRef, {
          ...contact,
          updatedAt: Timestamp.now(),
        }, { merge: true });
      }
      await batch.commit();
    }
  } catch (err: any) {
    console.warn(`[SyncCache] Background pre-warm note for user ${userId}:`, err?.message);
  }
}

/**
 * Retrieves pre-warmed WhatsApp contacts from Firestore cache.
 */
export async function getCachedWhatsAppContacts(userId: string): Promise<CachedWhatsAppContact[]> {
  try {
    const snap = await adminDb.collection('users').doc(userId).collection('wa_contacts_cache').get();
    if (snap.empty) return [];
    return snap.docs.map(doc => doc.data() as CachedWhatsAppContact);
  } catch {
    return [];
  }
}
