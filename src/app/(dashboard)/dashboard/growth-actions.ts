'use server';

import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export type GrowthShareType = 
  | 'whatsapp_chat' 
  | 'story_whatsapp' 
  | 'story_instagram' 
  | 'story_tiktok' 
  | 'copy_link' 
  | 'download_story';

export async function trackGrowthShareAction(type: GrowthShareType, username: string) {
  try {
    const cleanUsername = (username || '').trim().toLowerCase();
    
    // 1. Record event log in growth_events
    adminDb.collection('growth_events').add({
      type,
      username: cleanUsername,
      createdAt: new Date(),
    }).catch(() => {});

    // 2. Increment aggregated counter in system/growth_stats
    const statsRef = adminDb.collection('system').doc('growth_stats');
    const updateField: Record<string, any> = {
      totalShares: FieldValue.increment(1),
      [`byType.${type}`]: FieldValue.increment(1),
      lastUpdated: new Date(),
    };

    await statsRef.set(updateField, { merge: true }).catch(() => {});
    return { success: true };
  } catch (err: any) {
    console.warn('trackGrowthShareAction failed silently:', err.message);
    return { success: false };
  }
}
