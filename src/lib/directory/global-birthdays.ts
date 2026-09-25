import { adminDb } from '@/lib/firebase/admin';

export interface GlobalBirthdayEntry {
  phone: string;
  birthDay: number;
  birthMonth: number;
  birthYear?: number | null;
  verifiedBySelf: boolean;
  sourcesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Normalizes a phone number to standard E.164 digits-only format.
 * Rejects group JIDs, broadcast newsletters, and privacy LIDs.
 * Must be between 8 and 15 digits.
 */
export function normalizeGlobalPhone(rawPhone?: string | null): string | null {
  if (!rawPhone) return null;
  
  const trimmed = rawPhone.trim().toLowerCase();
  
  // Guard against non-direct JIDs
  if (
    trimmed.includes('@g.us') || 
    trimmed.includes('@newsletter') || 
    trimmed.includes('@lid') || 
    trimmed.includes('@broadcast')
  ) {
    return null;
  }

  // Strip non-digits
  const digits = trimmed.replace(/\D/g, '');

  // ITU-T E.164 specifies max 15 digits, minimum usually 8 for international dialing
  if (digits.length < 8 || digits.length > 15) {
    return null;
  }

  return digits;
}

/**
 * Records or updates a contact's birthday in the global directory.
 * - verifiedBySelf = true (e.g. submitted via /u/[username] or user's own profile) takes absolute priority.
 * - Non-self inputs cannot overwrite an entry that was already self-verified.
 */
export async function recordGlobalBirthday(
  phone: string,
  birthDay: number,
  birthMonth: number,
  birthYear?: number | null,
  verifiedBySelf: boolean = false
): Promise<boolean> {
  const cleanPhone = normalizeGlobalPhone(phone);
  if (!cleanPhone) return false;

  const day = Number(birthDay);
  const month = Number(birthMonth);
  const year = birthYear ? Number(birthYear) : null;

  if (!day || day < 1 || day > 31 || !month || month < 1 || month > 12) {
    return false;
  }

  try {
    const docRef = adminDb.collection('global_birthdays').doc(cleanPhone);
    const docSnap = await docRef.get();

    const now = new Date();

    if (!docSnap.exists) {
      await docRef.set({
        phone: cleanPhone,
        birthDay: day,
        birthMonth: month,
        birthYear: year,
        verifiedBySelf: Boolean(verifiedBySelf),
        sourcesCount: 1,
        createdAt: now,
        updatedAt: now,
      });
      return true;
    }

    const data = docSnap.data() || {};
    const existingIsVerified = Boolean(data.verifiedBySelf);

    // If existing entry was self-verified, a non-self submission cannot alter the birthday
    if (existingIsVerified && !verifiedBySelf) {
      await docRef.update({
        sourcesCount: (Number(data.sourcesCount) || 1) + 1,
        updatedAt: now,
      });
      return true;
    }

    // Overwrite with newer or self-verified data
    await docRef.update({
      birthDay: day,
      birthMonth: month,
      birthYear: year !== null ? year : (data.birthYear || null),
      verifiedBySelf: Boolean(verifiedBySelf || data.verifiedBySelf),
      sourcesCount: (Number(data.sourcesCount) || 1) + 1,
      updatedAt: now,
    });

    return true;
  } catch (error: any) {
    console.warn(`[GlobalBirthdays] Error recording birthday for phone ${cleanPhone}:`, error?.message);
    return false;
  }
}

/**
 * Looks up a single phone number in the global directory.
 */
export async function lookupSingleGlobalBirthday(phone: string): Promise<GlobalBirthdayEntry | null> {
  const cleanPhone = normalizeGlobalPhone(phone);
  if (!cleanPhone) return null;

  try {
    const docSnap = await adminDb.collection('global_birthdays').doc(cleanPhone).get();
    if (!docSnap.exists) return null;

    const data = docSnap.data()!;
    return {
      phone: cleanPhone,
      birthDay: Number(data.birthDay),
      birthMonth: Number(data.birthMonth),
      birthYear: data.birthYear ? Number(data.birthYear) : null,
      verifiedBySelf: Boolean(data.verifiedBySelf),
      sourcesCount: Number(data.sourcesCount) || 1,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now()),
    };
  } catch (error: any) {
    console.warn(`[GlobalBirthdays] Error looking up phone ${cleanPhone}:`, error?.message);
    return null;
  }
}

/**
 * Batch lookup of multiple phone numbers in the global directory.
 * Uses adminDb.getAll with chunking (up to 150 refs per call) for maximum speed and 0 wasted index reads.
 * Returns a Map keyed by normalized digits-only phone number.
 */
export async function lookupGlobalBirthdays(phones: string[]): Promise<Map<string, GlobalBirthdayEntry>> {
  const results = new Map<string, GlobalBirthdayEntry>();
  if (!phones || phones.length === 0) return results;

  // Deduplicate and normalize
  const validPhones = Array.from(
    new Set(
      phones
        .map(p => normalizeGlobalPhone(p))
        .filter((p): p is string => Boolean(p))
    )
  );

  if (validPhones.length === 0) return results;

  const CHUNK_SIZE = 150;
  for (let i = 0; i < validPhones.length; i += CHUNK_SIZE) {
    const chunk = validPhones.slice(i, i + CHUNK_SIZE);
    const docRefs = chunk.map(phone => adminDb.collection('global_birthdays').doc(phone));

    try {
      const docSnaps = await adminDb.getAll(...docRefs);
      for (const snap of docSnaps) {
        if (snap.exists) {
          const data = snap.data()!;
          const phone = snap.id;
          results.set(phone, {
            phone,
            birthDay: Number(data.birthDay),
            birthMonth: Number(data.birthMonth),
            birthYear: data.birthYear ? Number(data.birthYear) : null,
            verifiedBySelf: Boolean(data.verifiedBySelf),
            sourcesCount: Number(data.sourcesCount) || 1,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now()),
          });
        }
      }
    } catch (chunkError: any) {
      console.warn('[GlobalBirthdays] Error in chunk lookup:', chunkError?.message);
    }
  }

  return results;
}

/**
 * Batch records multiple entries into global_birthdays (ideal for backfills and bulk imports).
 */
export async function recordGlobalBirthdaysBatch(
  entries: Array<{
    phone: string;
    birthDay: number;
    birthMonth: number;
    birthYear?: number | null;
    verifiedBySelf?: boolean;
  }>
): Promise<number> {
  let savedCount = 0;
  if (!entries || entries.length === 0) return savedCount;

  // Filter valid entries
  const validEntries: Array<{
    phone: string;
    birthDay: number;
    birthMonth: number;
    birthYear: number | null;
    verifiedBySelf: boolean;
  }> = [];

  for (const e of entries) {
    const cleanPhone = normalizeGlobalPhone(e.phone);
    if (!cleanPhone) continue;
    const day = Number(e.birthDay);
    const month = Number(e.birthMonth);
    const year = e.birthYear ? Number(e.birthYear) : null;
    if (!day || day < 1 || day > 31 || !month || month < 1 || month > 12) continue;

    validEntries.push({
      phone: cleanPhone,
      birthDay: day,
      birthMonth: month,
      birthYear: year,
      verifiedBySelf: Boolean(e.verifiedBySelf),
    });
  }

  const BATCH_SIZE = 300;
  const now = new Date();

  for (let i = 0; i < validEntries.length; i += BATCH_SIZE) {
    const chunk = validEntries.slice(i, i + BATCH_SIZE);
    const batch = adminDb.batch();

    for (const item of chunk) {
      const docRef = adminDb.collection('global_birthdays').doc(item.phone);
      batch.set(
        docRef,
        {
          phone: item.phone,
          birthDay: item.birthDay,
          birthMonth: item.birthMonth,
          birthYear: item.birthYear,
          verifiedBySelf: item.verifiedBySelf,
          sourcesCount: 1,
          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      );
    }

    try {
      await batch.commit();
      savedCount += chunk.length;
    } catch (err: any) {
      console.warn('[GlobalBirthdays] Batch commit error:', err?.message);
    }
  }

  return savedCount;
}

/**
 * Returns overall statistics of the Global Birthdays Directory.
 */
export async function getGlobalBirthdaysStats(): Promise<{ totalCount: number; verifiedCount: number }> {
  try {
    const [totalSnap, verifiedSnap] = await Promise.all([
      adminDb.collection('global_birthdays').count().get().catch(() => null),
      adminDb.collection('global_birthdays').where('verifiedBySelf', '==', true).count().get().catch(() => null),
    ]);

    const totalCount = totalSnap ? totalSnap.data().count : 0;
    const verifiedCount = verifiedSnap ? verifiedSnap.data().count : 0;

    return { totalCount, verifiedCount };
  } catch (error: any) {
    console.warn('[GlobalBirthdays] Error fetching stats:', error?.message);
    return { totalCount: 0, verifiedCount: 0 };
  }
}
