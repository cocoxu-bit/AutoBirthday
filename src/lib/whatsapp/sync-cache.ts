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
  if (clean === 'whatsapp' || clean === 'desconocido' || clean === 'unknown') return true;
  if (/^[\d+\s\-()]+$/.test(clean)) return true;
  if (clean.startsWith('contacto (+') || clean.startsWith('contacto(+')) return true;
  return false;
};

/**
 * Extract ONLY the real WhatsApp message timestamp from a chat object.
 * STRICTLY avoids VPS database timestamps (updatedAt, timestamp, etc.)
 * Only trusts: lastMessage.messageTimestamp, conversationTimestamp
 */
function extractRealMessageTimestamp(chat: any): number {
  if (!chat) return 0;
  let best = 0;

  // ONLY these two fields are real WhatsApp message timestamps from Baileys
  const trustedSources = [
    chat.lastMessage?.messageTimestamp,
    chat.conversationTimestamp,
  ];

  for (const raw of trustedSources) {
    if (!raw) continue;
    let num = typeof raw === 'number' ? raw : Number(raw);
    if (isNaN(num) || num <= 0) continue;

    // Baileys sends timestamps in Unix SECONDS — convert to milliseconds
    if (num > 1e8 && num < 1e12) {
      num = num * 1000;
    }

    // Sanity check: must be a reasonable date (after 2015, before tomorrow)
    const YEAR_2015 = 1420070400000;
    const TOMORROW = Date.now() + 86400000;
    if (num >= YEAR_2015 && num <= TOMORROW && num > best) {
      best = num;
    }
  }

  return best;
}

// 18 months cutoff in milliseconds
const EIGHTEEN_MONTHS_MS = 18 * 30 * 24 * 60 * 60 * 1000;

/**
 * Pre-warms and caches WhatsApp contacts in Firestore.
 * 
 * KEY DESIGN DECISIONS:
 * 1. WIPE entire cache on each run to avoid stale data accumulation
 * 2. Only cache contacts with real names (no "Contacto (+XXXX)")
 * 3. Only cache contacts with recent activity (< 18 months)
 * 4. Sort purely by most recent message timestamp
 * 5. Only trust lastMessage.messageTimestamp and conversationTimestamp
 */
export async function prewarmWhatsAppContactsCache(userId: string): Promise<void> {
  const instanceName = `autocumple-${userId}`;

  try {
    const evoState = await evolutionApi.getConnectionState(instanceName).catch(() => null);
    if (evoState?.instance?.state !== 'open') {
      return;
    }

    const collectionRef = adminDb.collection('users').doc(userId).collection('wa_contacts_cache');

    // STEP 0: WIPE entire old cache to prevent stale data accumulation
    // This ensures no zombie entries with wrong timestamps persist
    try {
      const oldSnap = await collectionRef.get();
      if (!oldSnap.empty) {
        const BATCH_LIMIT = 450;
        const docs = oldSnap.docs;
        for (let i = 0; i < docs.length; i += BATCH_LIMIT) {
          const chunk = docs.slice(i, i + BATCH_LIMIT);
          const delBatch = adminDb.batch();
          chunk.forEach(doc => delBatch.delete(doc.ref));
          await delBatch.commit();
        }
      }
    } catch {}

    // STEP 1: Fetch all data from Evolution API in parallel
    const [rawChats, rawGroups, rawMessages] = await Promise.all([
      evolutionApi.fetchChats(instanceName, true).catch(() => []),
      evolutionApi.fetchAllGroupsWithParticipants(instanceName).catch(() => []),
      evolutionApi.fetchMessagesBatch(instanceName, 5).catch(() => []),
    ]);

    // Build name resolution map from message history
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

    // Enrich nameMap from group participant metadata
    for (const g of (rawGroups || [])) {
      for (const p of (g.participants || [])) {
        const rawPhone = p.phoneNumber || p.id || '';
        const phone = rawPhone.replace(/@.*$/, '').replace(/\D/g, '');
        if (!phone || phone.length < 6 || nameMap.has(phone)) continue;

        // Try pushName, notify, name from group participant
        const pName = p.pushName || p.notify || p.name;
        if (pName && !isInvalidName(pName)) {
          nameMap.set(phone, pName.trim());
        }
      }
    }

    // STEP 2: Build contacts from 1-on-1 chats ONLY
    const activityCutoff = Date.now() - EIGHTEEN_MONTHS_MS;
    const contactMap = new Map<string, Omit<CachedWhatsAppContact, 'updatedAt'>>();

    for (const rawC of (rawChats || [])) {
      const c = rawC as any;
      const jid = c.jid || c.remoteJid || c.id || '';
      if (!jid.endsWith('@s.whatsapp.net')) continue;

      const cleanPhone = jid.replace(/@.*$/, '').replace(/\D/g, '');
      if (!cleanPhone || cleanPhone.length < 6) continue;

      // Extract REAL message timestamp (strict — no VPS database timestamps)
      const time = extractRealMessageTimestamp(c);

      // SKIP contacts with no recent activity (older than 18 months or timestamp = 0)
      if (time === 0 || time < activityCutoff) continue;

      // Resolve name from multiple sources
      let name: string | undefined = c.name;
      if (isInvalidName(name)) name = c.pushName;
      if (isInvalidName(name)) name = c.lastMessage?.pushName;
      if (isInvalidName(name)) name = nameMap.get(cleanPhone);

      // SKIP nameless contacts entirely
      if (isInvalidName(name)) continue;

      const displayName = (name as string).trim();

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

    const allCandidates = Array.from(contactMap.values());
    if (allCandidates.length === 0) return;

    // Sort purely by most recent conversation
    allCandidates.sort((a, b) => b.lastActivity - a.lastActivity);

    // STEP 3: Fetch profile photos for top 80 contacts
    const photosToFetch = allCandidates.slice(0, 80);
    const PHOTO_CHUNK = 10;

    for (let i = 0; i < photosToFetch.length; i += PHOTO_CHUNK) {
      const chunk = photosToFetch.slice(i, i + PHOTO_CHUNK);
      await Promise.all(chunk.map(async c => {
        if (!c.profilePictureUrl) {
          try {
            const pic = await evolutionApi.fetchProfilePictureUrl(instanceName, c.phone);
            if (pic) c.profilePictureUrl = pic;
          } catch {}
        }
      }));
    }

    // STEP 4: Write to Firestore in batches
    const BATCH_LIMIT = 450;
    for (let i = 0; i < allCandidates.length; i += BATCH_LIMIT) {
      const batchChunk = allCandidates.slice(i, i + BATCH_LIMIT);
      const batch = adminDb.batch();
      for (const contact of batchChunk) {
        const docRef = collectionRef.doc(contact.phone);
        batch.set(docRef, {
          ...contact,
          updatedAt: Timestamp.now(),
        });
      }
      await batch.commit();
    }
  } catch (err: any) {
    console.warn(`[SyncCache] Background pre-warm error for user ${userId}:`, err?.message);
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
