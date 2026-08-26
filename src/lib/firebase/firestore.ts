import { adminDb } from './admin';
import type {
  UserProfile,
  WhatsAppInstance,
  Contact,
  Template,
  ScheduledWish,
} from '@/types';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function serializeData(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj?.toDate === 'function') {
    return obj.toDate().toISOString();
  }
  if (typeof obj?._seconds === 'number') {
    return new Date(obj._seconds * 1000).toISOString();
  }
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  if (Array.isArray(obj)) {
    return obj.map(serializeData);
  }
  if (typeof obj === 'object') {
    const res: any = {};
    for (const key of Object.keys(obj)) {
      res[key] = serializeData(obj[key]);
    }
    return res;
  }
  return obj;
}

function serializeDoc<T>(doc: FirebaseFirestore.DocumentSnapshot): T {
  const data = doc.data() || {};
  return {
    id: doc.id,
    ...serializeData(data),
  } as T;
}

function cleanUndefinedValues<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !(value instanceof Date) && !Array.isArray(value)) {
        result[key] = cleanUndefinedValues(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

type CreateContactData = Omit<Contact<Date>, 'id' | 'createdAt' | 'updatedAt'>;
type CreateTemplateData = Omit<Template<Date>, 'id' | 'createdAt' | 'userId'>;
type CreateWishData = Omit<ScheduledWish<Date>, 'id' | 'createdAt'>;

// ─── User Profile ──────────────────────────────────────────────────────────────

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const doc = await adminDb.collection('users').doc(userId).get();
  return doc.exists ? serializeDoc<UserProfile>(doc) : null;
}

export async function createUserProfile(userId: string, data: Partial<UserProfile<Date>>): Promise<void> {
  await adminDb.collection('users').doc(userId).set(
    cleanUndefinedValues({
      ...data,
      timezone: data.timezone || 'Europe/Madrid',
      createdAt: new Date(),
    }),
    { merge: true },
  );
}

export async function updateUserProfile(userId: string, data: Record<string, unknown>): Promise<void> {
  await adminDb.collection('users').doc(userId).update(cleanUndefinedValues(data));
}

// ─── WhatsApp Instance ─────────────────────────────────────────────────────────

export async function getWhatsAppInstance(userId: string): Promise<WhatsAppInstance | null> {
  const doc = await adminDb
    .collection('users')
    .doc(userId)
    .collection('whatsapp')
    .doc('instance')
    .get();
  return doc.exists ? serializeDoc<WhatsAppInstance>(doc) : null;
}

export async function updateWhatsAppInstance(
  userId: string,
  data: Partial<WhatsAppInstance>,
): Promise<void> {
  await adminDb
    .collection('users')
    .doc(userId)
    .collection('whatsapp')
    .doc('instance')
    .set(cleanUndefinedValues({ ...data, updatedAt: new Date() }), { merge: true });
}

// ─── Contacts ──────────────────────────────────────────────────────────────────

export async function getContacts(userId: string): Promise<Contact[]> {
  const snapshot = await adminDb
    .collection('users')
    .doc(userId)
    .collection('contacts')
    .get();
  return snapshot.docs.map((doc) => serializeDoc<Contact>(doc));
}

export async function getContact(
  userId: string,
  contactId: string,
): Promise<Contact | null> {
  const doc = await adminDb
    .collection('users')
    .doc(userId)
    .collection('contacts')
    .doc(contactId)
    .get();
  return doc.exists ? serializeDoc<Contact>(doc) : null;
}

export async function createContact(
  userId: string,
  data: CreateContactData,
): Promise<string> {
  const docRef = await adminDb
    .collection('users')
    .doc(userId)
    .collection('contacts')
    .add(cleanUndefinedValues({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  return docRef.id;
}

export async function updateContact(
  userId: string,
  contactId: string,
  data: Record<string, unknown>,
): Promise<void> {
  await adminDb
    .collection('users')
    .doc(userId)
    .collection('contacts')
    .doc(contactId)
    .update(cleanUndefinedValues({ ...data, updatedAt: new Date() }));
}

export async function deleteContact(userId: string, contactId: string): Promise<void> {
  await adminDb
    .collection('users')
    .doc(userId)
    .collection('contacts')
    .doc(contactId)
    .delete();
}

// ─── Templates ─────────────────────────────────────────────────────────────────

export async function getTemplates(userId: string): Promise<Template[]> {
  const snapshot = await adminDb
    .collection('users')
    .doc(userId)
    .collection('templates')
    .get();
  return snapshot.docs.map((doc) => serializeDoc<Template>(doc));
}

export async function getTemplate(
  userId: string,
  templateId: string,
): Promise<Template | null> {
  const doc = await adminDb
    .collection('users')
    .doc(userId)
    .collection('templates')
    .doc(templateId)
    .get();
  return doc.exists ? serializeDoc<Template>(doc) : null;
}

export async function createTemplate(
  userId: string,
  data: CreateTemplateData,
): Promise<string> {
  const docRef = await adminDb
    .collection('users')
    .doc(userId)
    .collection('templates')
    .add({
      ...data,
      userId,
      createdAt: new Date(),
    });
  return docRef.id;
}

export async function updateTemplate(
  userId: string,
  templateId: string,
  data: Record<string, unknown>,
): Promise<void> {
  await adminDb
    .collection('users')
    .doc(userId)
    .collection('templates')
    .doc(templateId)
    .update(data);
}

export async function deleteTemplate(userId: string, templateId: string): Promise<void> {
  await adminDb
    .collection('users')
    .doc(userId)
    .collection('templates')
    .doc(templateId)
    .delete();
}

// ─── Wishes (top-level collection) ─────────────────────────────────────────────

export async function getWishes(
  userId: string,
  filters?: { status?: string },
): Promise<ScheduledWish[]> {
  let query: FirebaseFirestore.Query = adminDb
    .collection('wishes')
    .where('userId', '==', userId);

  if (filters?.status) {
    query = query.where('status', '==', filters.status);
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => serializeDoc<ScheduledWish>(doc));
}

export async function getWish(wishId: string): Promise<ScheduledWish | null> {
  const doc = await adminDb.collection('wishes').doc(wishId).get();
  return doc.exists ? serializeDoc<ScheduledWish>(doc) : null;
}

export async function createWish(data: CreateWishData): Promise<string> {
  const docRef = await adminDb.collection('wishes').add({
    ...data,
    createdAt: new Date(),
  });
  return docRef.id;
}

export async function updateWish(
  wishId: string,
  data: Record<string, unknown>,
): Promise<void> {
  await adminDb.collection('wishes').doc(wishId).update(data);
}
