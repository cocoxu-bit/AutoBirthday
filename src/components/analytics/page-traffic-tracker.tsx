'use client';

import { useEffect } from 'react';
import { recordPageViewAction } from '@/lib/analytics/traffic-actions';

interface PageTrafficTrackerProps {
  path: string;
  title?: string;
  category?: 'core' | 'seo_hub' | 'seo_programmatic' | 'viral_collector';
}

export function PageTrafficTracker({ path, title, category }: PageTrafficTrackerProps) {
  useEffect(() => {
    // Avoid double counting if already visited in this browser session
    const sessionKey = `ab_pv_${path}`;
    try {
      if (sessionStorage.getItem(sessionKey)) {
        return;
      }
      sessionStorage.setItem(sessionKey, '1');
    } catch {
      // Ignore storage errors in private browsing modes
    }

    recordPageViewAction({
      path,
      title,
      category,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
    }).catch(() => {});
  }, [path, title, category]);

  return null;
}
