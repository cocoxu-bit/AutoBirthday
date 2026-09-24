import { adminDb } from '@/lib/firebase/admin';

/**
 * Normalizes text to a clean URL-friendly slug.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD') // separate accents from letters
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric chars
    .replace(/[\s_-]+/g, '-') // swap spaces and underscores for single dash
    .replace(/^-+|-+$/g, '') // trim leading and trailing dashes
    || 'amigo';
}

/**
 * Gets or creates a guaranteed unique username slug for a user.
 */
export async function getOrCreateUserUsername(userId: string): Promise<string> {
  const userRef = adminDb.collection('users').doc(userId);
  const userDoc = await userRef.get();
  
  if (!userDoc.exists) {
    throw new Error('Usuario no encontrado');
  }

  const userData = userDoc.data();
  if (userData?.username && typeof userData.username === 'string' && userData.username.trim().length > 0) {
    return userData.username.trim().toLowerCase();
  }

  // Generate candidate from displayName or email prefix
  const rawBase = userData?.displayName || userData?.name || (userData?.email ? userData.email.split('@')[0] : 'usuario');
  const baseSlug = slugify(rawBase);

  // Check if baseSlug is available
  let candidate = baseSlug;
  let isAvailable = false;
  let attempts = 0;

  while (!isAvailable && attempts < 10) {
    const existing = await adminDb
      .collection('users')
      .where('username', '==', candidate)
      .limit(1)
      .get();

    if (existing.empty || existing.docs[0].id === userId) {
      isAvailable = true;
    } else {
      attempts++;
      const suffix = Math.floor(100 + Math.random() * 900); // 3-digit random
      candidate = `${baseSlug}-${suffix}`;
    }
  }

  if (!isAvailable) {
    candidate = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;
  }

  // Save unique username to user document
  await userRef.set({ username: candidate }, { merge: true });

  return candidate;
}

/**
 * Look up public host details by their unique username slug.
 */
export async function getUserByUsername(username: string): Promise<{
  userId: string;
  displayName: string;
  photoURL?: string | null;
  username: string;
} | null> {
  const clean = username.trim().toLowerCase();
  if (!clean) return null;

  const snap = await adminDb
    .collection('users')
    .where('username', '==', clean)
    .limit(1)
    .get();

  if (snap.empty) {
    return null;
  }

  const doc = snap.docs[0];
  const d = doc.data();

  return {
    userId: doc.id,
    displayName: d.displayName || d.name || 'Tu amigo/a',
    photoURL: d.photoURL || d.whatsappInstance?.profilePicUrl || null,
    username: clean,
  };
}
