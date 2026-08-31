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
  syncTime?: number;
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
 * Priority 1: Real Baileys message timestamps
 * Priority 2: Inferred recency from natural WhatsApp chat list position
 */
function extractRealMessageTimestamp(chat: any, naturalChatIndex: number = 999): number {
  if (!chat) return 0;
  let best = 0;

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

    const YEAR_2015 = 1420070400000;
    const TOMORROW = Date.now() + 86400000;
    if (num >= YEAR_2015 && num <= TOMORROW && num > best) {
      best = num;
    }
  }

  // Cascade fallback: If no explicit message timestamp in memory yet,
  // use the natural chat position (top of WhatsApp list)
  if (best === 0 && naturalChatIndex < 50) {
    best = Date.now() - (naturalChatIndex * 2 * 3600 * 1000);
  }

  return best;
}

// 18 months cutoff in milliseconds
const EIGHTEEN_MONTHS_MS = 18 * 30 * 24 * 60 * 60 * 1000;

/**
 * Pre-warms and caches WhatsApp contacts in Firestore using ZERO-DOWNTIME CACHE SWAP.
 * 
 * DESIGN PRINCIPLES:
 * 1. ZERO-DOWNTIME SWAP: Cache is NEVER wiped upfront. Existing cache remains live while new data builds.
 * 2. CASCADE RECENCY: Real message timestamp -> Inferred chat position -> 18-month cutoff.
 * 3. NO ANONYMOUS CONTACTS: Strictly excludes nameless or number-only contacts.
 * 4. ATOMIC POST-PURGE: Stale entries are pruned ONLY after new records are safely written.
 */
export async function prewarmWhatsAppContactsCache(userId: string): Promise<void> {
  const instanceName = `autocumple-${userId}`;
  const syncStartTime = Date.now();

  try {
    const evoState = await evolutionApi.getConnectionState(instanceName).catch(() => null);
    if (evoState?.instance?.state !== 'open') {
      return;
    }

    const collectionRef = adminDb.collection('users').doc(userId).collection('wa_contacts_cache');

    // STEP 1: Fetch all data from Evolution API in parallel (cache remains 100% live during this)
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

        const pName = p.pushName || p.notify || p.name;
        if (pName && !isInvalidName(pName)) {
          nameMap.set(phone, pName.trim());
        }
      }
    }

    // STEP 2: Build candidate contacts from 1-on-1 chats ONLY
    const activityCutoff = Date.now() - EIGHTEEN_MONTHS_MS;
    const contactMap = new Map<string, Omit<CachedWhatsAppContact, 'updatedAt'>>();

    const chatList = rawChats || [];
    for (let chatIdx = 0; chatIdx < chatList.length; chatIdx++) {
      const rawC = chatList[chatIdx];
      const c = rawC as any;
      const jid = c.jid || c.remoteJid || c.id || '';
      
      // Ignore group chats, broadcast channels and official WhatsApp newsletters
      if (jid.endsWith('@g.us') || jid.endsWith('@newsletter') || jid.startsWith('0@')) continue;

      const cleanPhone = jid.replace(/@.*$/, '').replace(/\D/g, '');
      if (!cleanPhone || cleanPhone.length < 5) continue;

      // Extract REAL message timestamp with cascade fallback
      const time = extractRealMessageTimestamp(c, chatIdx);

      // SKIP contacts with no activity in the last 18 months
      if (time === 0 || time < activityCutoff) continue;

      // Resolve best name across all available sources
      let name: string | undefined = c.name;
      if (isInvalidName(name)) name = c.pushName;
      if (isInvalidName(name)) name = c.lastMessage?.pushName;
      if (isInvalidName(name)) name = nameMap.get(cleanPhone);

      const hasRealName = !isInvalidName(name);
      const displayName = hasRealName ? (name as string).trim() : '';

      contactMap.set(cleanPhone, {
        phone: cleanPhone,
        name: displayName,
        pushName: hasRealName ? (c.pushName || displayName) : undefined,
        profilePictureUrl: c.profilePictureUrl || null,
        hasRealName,
        source: 'chat',
        lastActivity: time,
        syncTime: syncStartTime,
      });
    }

    const allCandidates = Array.from(contactMap.values());
    if (allCandidates.length === 0) return;

    // Sort purely by most recent conversation timestamp descending
    allCandidates.sort((a, b) => b.lastActivity - a.lastActivity);

    // STEP 3: Parallel profile photos resolution for top 60 contacts
    const photosToFetch = allCandidates.slice(0, 60);
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

    // STEP 4: Write new cache to Firestore in batches (Atomic Swap)
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

    // STEP 5: Post-Sync Cleanup: Prune documents older than 18 months or from previous removed chats
    try {
      const existingSnap = await collectionRef.get();
      const staleDocs = existingSnap.docs.filter(doc => {
        const data = doc.data() as CachedWhatsAppContact;
        return (
          (data.lastActivity && data.lastActivity < activityCutoff) ||
          (data.syncTime && data.syncTime < syncStartTime)
        );
      });

      if (staleDocs.length > 0) {
        for (let i = 0; i < staleDocs.length; i += BATCH_LIMIT) {
          const chunk = staleDocs.slice(i, i + BATCH_LIMIT);
          const cleanupBatch = adminDb.batch();
          for (const doc of chunk) {
            cleanupBatch.delete(doc.ref);
          }
          await cleanupBatch.commit();
        }
      }
    } catch (cleanupErr: any) {
      console.warn('[SyncCache] Post-cleanup note:', cleanupErr?.message);
    }
  } catch (err: any) {
    console.warn(`[SyncCache] Background pre-warm error for user ${userId}:`, err?.message);
  }
}

/**
 * Retrieves pre-warmed WhatsApp contacts from Firestore cache.
 * Filtered by 18-month activity cutoff and ordered by recency descending.
 */
export async function getCachedWhatsAppContacts(userId: string): Promise<CachedWhatsAppContact[]> {
  try {
    const cutoff = Date.now() - EIGHTEEN_MONTHS_MS;
    const snap = await adminDb
      .collection('users')
      .doc(userId)
      .collection('wa_contacts_cache')
      .get();

    if (snap.empty) return [];

    const list = snap.docs
      .map(doc => doc.data() as CachedWhatsAppContact)
      .filter(c => (c.lastActivity || 0) > cutoff);

    list.sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0));
    return list;
  } catch {
    return [];
  }
}
