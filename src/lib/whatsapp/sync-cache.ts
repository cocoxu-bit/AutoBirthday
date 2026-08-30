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

/**
 * Pre-warms and caches WhatsApp contacts, pushNames, and HD profile photos
 * directly in Firestore right when the user connects their WhatsApp account.
 */
export async function prewarmWhatsAppContactsCache(userId: string): Promise<void> {
  const instanceName = `autocumple-${userId}`;

  try {
    const evoState = await evolutionApi.getConnectionState(instanceName).catch(() => null);
    if (evoState?.instance?.state !== 'open') {
      return;
    }

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

    // 2. Build candidate contacts pool
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
      const displayName = hasRealName ? (name as string).trim() : `Contacto (+${cleanPhone.slice(-4)})`;
      const time = c.lastMessage?.messageTimestamp 
        ? c.lastMessage.messageTimestamp * 1000 
        : (c.updatedAt ? new Date(c.updatedAt).getTime() : 0);

      contactMap.set(cleanPhone, {
        phone: cleanPhone,
        name: displayName,
        pushName: c.pushName && !isInvalidName(c.pushName) ? c.pushName : nameMap.get(cleanPhone),
        profilePictureUrl: c.profilePictureUrl || null,
        hasRealName,
        source: 'chat',
        lastActivity: time,
      });
    }

    // B. Group participants
    for (const g of (rawGroups || [])) {
      const gSubject = g.subject || g.name || 'Grupo de WhatsApp';
      for (const p of (g.participants || [])) {
        const rawPhone = p.phoneNumber || p.id || '';
        const cleanPhone = rawPhone.replace(/@.*$/, '').replace(/\D/g, '');
        if (!cleanPhone || cleanPhone.length < 6) continue;

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
            hasRealName: true,
            source: 'group_participant',
            groupContext: gSubject,
            lastActivity: 0,
          });
        }
      }
    }

    const allCandidates = Array.from(contactMap.values());
    if (allCandidates.length === 0) return;

    // Sort: Named contacts first, then by activity
    allCandidates.sort((a, b) => {
      if (a.hasRealName && !b.hasRealName) return -1;
      if (!a.hasRealName && b.hasRealName) return 1;
      return b.lastActivity - a.lastActivity;
    });

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

    // 4. Batch write to Firestore cache in chunks of 450
    const batch = adminDb.batch();
    const collectionRef = adminDb.collection('users').doc(userId).collection('wa_contacts_cache');

    for (const contact of allCandidates) {
      const docRef = collectionRef.doc(contact.phone);
      batch.set(docRef, {
        ...contact,
        updatedAt: Timestamp.now(),
      }, { merge: true });
    }

    await batch.commit();
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
