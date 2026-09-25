'use server';

import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export interface RecordPageViewPayload {
  path: string;
  title?: string;
  category?: 'core' | 'seo_hub' | 'seo_programmatic' | 'viral_collector';
  referrer?: string;
}

function pathToTrafficDocId(path: string): string {
  const normalized = path.trim().replace(/^\//, '').replace(/\/$/, '');
  return normalized.replace(/\//g, '__') || 'root';
}

/**
 * Registra una visita en la colección `url_traffic` de Firestore.
 * Ejecuta una actualización atómica con FieldValue.increment(1).
 */
export async function recordPageViewAction(payload: RecordPageViewPayload) {
  try {
    const rawPath = payload.path || '/';
    const cleanPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
    const docId = pathToTrafficDocId(cleanPath);

    const docRef = adminDb.collection('url_traffic').doc(docId);

    const updateData: Record<string, any> = {
      path: cleanPath,
      views: FieldValue.increment(1),
      lastVisited: new Date(),
    };

    if (payload.title) {
      updateData.title = payload.title;
    }
    if (payload.category) {
      updateData.category = payload.category;
    }
    if (payload.referrer && payload.referrer.length > 0) {
      updateData.lastReferrer = payload.referrer.slice(0, 200);
    }

    await docRef.set(updateData, { merge: true });
    return { success: true };
  } catch (error: any) {
    // Non-blocking for client experience
    console.warn('[recordPageViewAction] Failed silently:', error?.message);
    return { success: false };
  }
}

/**
 * Registra una acción de conversión en la página (generación de felicitación, captura de cumple, etc.)
 */
export async function recordPageConversionAction(path: string, conversionType = 'action') {
  try {
    const rawPath = path || '/';
    const cleanPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
    const docId = pathToTrafficDocId(cleanPath);

    const docRef = adminDb.collection('url_traffic').doc(docId);

    await docRef.set({
      path: cleanPath,
      conversions: FieldValue.increment(1),
      [`conversionBreakdown.${conversionType}`]: FieldValue.increment(1),
      lastConversionAt: new Date(),
    }, { merge: true });

    return { success: true };
  } catch (error: any) {
    console.warn('[recordPageConversionAction] Failed silently:', error?.message);
    return { success: false };
  }
}
