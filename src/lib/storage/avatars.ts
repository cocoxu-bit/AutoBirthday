import { adminStorage } from '@/lib/firebase/admin';
import crypto from 'crypto';

/**
 * Downloads a temporary WhatsApp/Meta CDN profile picture and persists it
 * permanently into Firebase Storage with a perpetual download token.
 * 
 * If storage is not yet activated or if the fetch fails, it gracefully falls back
 * to the original URL or null, guaranteeing zero runtime crashes.
 */
export async function persistAvatarToStorage(
  userId: string,
  identifier: string, // phone number or group id
  sourceUrl?: string | null
): Promise<string | null> {
  if (!sourceUrl || !sourceUrl.trim()) return null;

  // If already hosted on Firebase Storage, return as is
  if (sourceUrl.includes('firebasestorage.googleapis.com') || sourceUrl.includes('storage.googleapis.com')) {
    return sourceUrl;
  }

  // Only proceed if it looks like a remote HTTP/HTTPS URL
  if (!sourceUrl.startsWith('http://') && !sourceUrl.startsWith('https://')) {
    return sourceUrl;
  }

  try {
    // 1. Download image from temporary WhatsApp CDN with strict 5-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(sourceUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AutoBirthday/1.0)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[AvatarStorage] Failed to download avatar from ${sourceUrl}: HTTP ${response.status}`);
      return sourceUrl; // Fallback to original URL
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Skip suspiciously tiny or empty responses (< 200 bytes)
    if (buffer.length < 200) {
      return sourceUrl;
    }

    // 2. Prepare destination path and perpetual download token
    const cleanId = identifier.replace(/[@+]/g, '').trim() || 'unknown';
    const filePath = `avatars/${userId}/${cleanId}.jpg`;
    const downloadToken = crypto.randomUUID();

    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'cumple-9bcd7.firebasestorage.app';
    const bucket = adminStorage.bucket(bucketName);
    const file = bucket.file(filePath);

    // 3. Save to Firebase Storage
    await file.save(buffer, {
      metadata: {
        contentType: response.headers.get('content-type') || 'image/jpeg',
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
          sourceUrlOrigin: 'whatsapp',
          uploadedAt: new Date().toISOString(),
        },
      },
      resumable: false,
    });

    // 4. Construct permanent standard Firebase download URL
    const permanentUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media&token=${downloadToken}`;
    
    return permanentUrl;
  } catch (error: any) {
    // Graceful fallback: do not crash if bucket does not exist yet or storage is initializing
    console.warn(`[AvatarStorage] Graceful fallback for ${identifier}:`, error.message);
    return sourceUrl;
  }
}
