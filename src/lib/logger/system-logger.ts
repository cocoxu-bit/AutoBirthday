import { adminDb } from '@/lib/firebase/admin';

export type LogSeverity = 'error' | 'warning' | 'info';
export type LogSource = 
  | 'cron:daily-scan' 
  | 'cron:send-wishes' 
  | 'webhook:evolution' 
  | 'ai:gemini' 
  | 'storage:avatar' 
  | 'auth' 
  | 'system';

export interface SystemLogEntry {
  id?: string;
  timestamp: number;
  isoDate: string;
  severity: LogSeverity;
  source: LogSource;
  message: string;
  details?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  metadata?: Record<string, any> | null;
}

/**
 * Persists an incident or error event into Firestore's `system_logs` collection.
 * Defensively wrapped to guarantee zero side-effects or crashes on the caller.
 */
export async function logSystemEvent(event: {
  severity: LogSeverity;
  source: LogSource;
  message: string;
  details?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  metadata?: Record<string, any> | null;
}): Promise<void> {
  const timestamp = Date.now();
  const isoDate = new Date(timestamp).toISOString();

  // 1. Log to server console with structured tag
  const tag = `[${event.severity.toUpperCase()}][${event.source}]`;
  if (event.severity === 'error') {
    console.error(`${tag} ${event.message}`, event.details || '', event.metadata || '');
  } else if (event.severity === 'warning') {
    console.warn(`${tag} ${event.message}`, event.details || '', event.metadata || '');
  } else {
    console.log(`${tag} ${event.message}`);
  }

  // 2. Persist to Firestore `system_logs`
  try {
    await adminDb.collection('system_logs').add({
      timestamp,
      isoDate,
      severity: event.severity,
      source: event.source,
      message: event.message,
      details: event.details || null,
      userId: event.userId || null,
      userEmail: event.userEmail || null,
      metadata: event.metadata || null,
    });
  } catch (dbErr: any) {
    console.error('[SystemLogger] Failed to write to system_logs collection:', dbErr.message);
  }
}
