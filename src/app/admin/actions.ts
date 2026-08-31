'use server';
import os from 'os';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { evolutionApi } from '@/lib/evolution-api/client';
import { executeSendWishes } from '@/lib/scheduler/send-wishes';

const ADMIN_EMAILS = [
  'lucasjimeneznavarro@gmail.com',
];

export interface AdminSystemTelemetry {
  timestamp: number;
  server: {
    nodeVersion: string;
    platform: string;
    arch: string;
    uptimeSeconds: number;
    memory: {
      heapUsedMb: number;
      heapTotalMb: number;
      rssMb: number;
      externalMb: number;
      systemTotalRamMb: number;
      systemFreeRamMb: number;
      heapUsagePercent: number;
    };
    loadAvg: number[];
    environment: string;
  };
  vps: {
    status: 'online' | 'degraded' | 'offline';
    latencyMs: number;
    apiUrl: string;
    totalInstances: number;
    connectedInstances: number;
    connectingInstances: number;
    disconnectedInstances: number;
    instancesList: Array<{
      name: string;
      status: string;
      ownerPhone?: string;
    }>;
  };
  aiTokens: {
    model: string;
    totalAiWishes: number;
    estimatedPromptTokens: number;
    estimatedCompletionTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
    estimatedCostEur: number;
    avgTokensPerWish: number;
    geminiStatus: 'healthy' | 'unconfigured' | 'error';
  };
  firestore: {
    status: 'healthy' | 'error';
    totalUsersCount: number;
    totalContactsCount: number;
    totalWishesCount: number;
    totalTemplatesCount: number;
    estimatedStorageMb: number;
  };
}

export interface AdminUserRecord {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  createdAt: string;
  createdAtMs: number;
  whatsappStatus: 'connected' | 'disconnected' | 'qrcode';
  whatsappPhone?: string | null;
  contactsCount: number;
  activeContactsCount: number;
  wishesSentCount: number;
  wishesTotalCount: number;
  templatesCount: number;
  isSuspended: boolean;
  isActivated: boolean;
  isAtRisk: boolean;
  autoSendContactsCount: number;
  fixedModeContactsCount: number;
  templateModeContactsCount: number;
  aiModeContactsCount: number;
}

export interface AdminWishRecord {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  status: 'pending' | 'needs_approval' | 'approved' | 'queued' | 'sent' | 'failed' | 'cancelled';
  mode: string;
  message: string;
  scheduledFor: string;
  sentAt?: string;
  errorMessage?: string;
}

export interface AdminAnalyticsData {
  summary: {
    totalUsers: number;
    newUsersLast7Days: number;
    newUsersLast30Days: number;
    whatsappConnectedCount: number;
    whatsappConnectedRate: number;
    totalContacts: number;
    totalActiveContacts: number;
    totalWishesSent: number;
    totalTemplates: number;
    avgContactsPerUser: number;
    activatedUsersCount: number;
    activatedUsersRate: number;
    atRiskUsersCount: number;
    autoSendContactsRate: number;
    totalFixedModeContacts: number;
    fixedModeContactsRate: number;
    totalTemplateModeContacts: number;
    templateModeContactsRate: number;
    totalAiModeContacts: number;
    aiModeContactsRate: number;
    totalFailedWishes: number;
  };
  users: AdminUserRecord[];
}

async function verifyAdminAuth(): Promise<string> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  if (!sessionCookie) throw new Error('No autenticado');

  const decoded = await adminAuth.verifySessionCookie(sessionCookie, false);
  const email = (decoded.email || '').toLowerCase().trim();

  if (!ADMIN_EMAILS.includes(email)) {
    throw new Error('Acceso no autorizado al panel de administración');
  }

  return decoded.uid;
}

export async function getAdminAnalyticsDataAction(): Promise<{
  success: boolean;
  data?: AdminAnalyticsData;
  error?: string;
}> {
  try {
    await verifyAdminAuth();

    const usersSnap = await adminDb.collection('users').get();
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    let totalFailedWishes = 0;

    const userPromises = usersSnap.docs.map(async (doc) => {
      const u = doc.data();
      const userId = doc.id;

      // Extract registration date
      let createdAtMs = now;
      let createdAtStr = 'Reciente';

      if (u.createdAt) {
        if (typeof u.createdAt.toDate === 'function') {
          const date = u.createdAt.toDate();
          createdAtMs = date.getTime();
          createdAtStr = date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });
        } else if (u.createdAt._seconds) {
          const date = new Date(u.createdAt._seconds * 1000);
          createdAtMs = date.getTime();
          createdAtStr = date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });
        }
      }

      // Fetch user subcollections in parallel
      const [contactsSnap, wishesSnap, templatesSnap] = await Promise.all([
        adminDb.collection('users').doc(userId).collection('contacts').get().catch(() => ({ docs: [] } as any)),
        adminDb.collection('users').doc(userId).collection('wishes').get().catch(() => ({ docs: [] } as any)),
        adminDb.collection('users').doc(userId).collection('templates').get().catch(() => ({ docs: [] } as any)),
      ]);

      const contacts = contactsSnap.docs.map((d: any) => d.data());
      const wishes = wishesSnap.docs.map((d: any) => d.data());

      const contactsCount = contacts.length;
      const activeContactsCount = contacts.filter((c: any) => c.isActive !== false).length;
      const autoSendContactsCount = contacts.filter((c: any) => c.autoSend === true).length;
      
      const fixedModeContactsCount = contacts.filter((c: any) => c.mode === 'manual' || (!c.mode && !c.templateId)).length;
      const templateModeContactsCount = contacts.filter((c: any) => c.mode === 'template' || Boolean(c.templateId)).length;
      const aiModeContactsCount = contacts.filter((c: any) => c.mode === 'ai').length;

      const wishesSentCount = wishes.filter((w: any) => w.status === 'sent').length;
      const wishesFailedCount = wishes.filter((w: any) => w.status === 'failed').length;
      totalFailedWishes += wishesFailedCount;
      const wishesTotalCount = wishes.length;
      const templatesCount = templatesSnap.docs.length;

      const waStatus: 'connected' | 'disconnected' | 'qrcode' = 
        u.whatsappInstance?.status === 'connected' ? 'connected' :
        u.whatsappInstance?.status === 'qrcode' ? 'qrcode' : 'disconnected';

      let resolvedEmail = u.email;
      let resolvedDisplayName = u.displayName || u.name;
      let resolvedPhotoURL = u.photoURL;

      // If email is missing in Firestore, resolve directly from Firebase Authentication
      if (!resolvedEmail || resolvedEmail === 'Sin correo') {
        try {
          const authRecord = await adminAuth.getUser(userId);
          if (authRecord.email) {
            resolvedEmail = authRecord.email;
            if (!resolvedDisplayName && authRecord.displayName) {
              resolvedDisplayName = authRecord.displayName;
            }
            if (!resolvedPhotoURL && authRecord.photoURL) {
              resolvedPhotoURL = authRecord.photoURL;
            }
            // Auto backfill to Firestore so it stays synced
            adminDb.collection('users').doc(userId).set({
              email: authRecord.email,
              displayName: resolvedDisplayName || authRecord.email.split('@')[0],
            }, { merge: true }).catch(() => {});
          }
        } catch {
          // User document exists in Firestore but was created as test mock / orphan before auth
          resolvedEmail = 'Doc huérfano (Sin Auth)';
        }
      }

      const isActivated = contactsCount >= 5;
      const isAtRisk = contactsCount > 0 && waStatus === 'disconnected';
      const isSuspended = Boolean(u.isSuspended);

      const userRecord: AdminUserRecord = {
        id: userId,
        email: resolvedEmail || 'Sin correo',
        displayName: resolvedDisplayName || 'Usuario',
        photoURL: resolvedPhotoURL || null,
        createdAt: createdAtStr,
        createdAtMs,
        whatsappStatus: waStatus,
        whatsappPhone: u.whatsappInstance?.phoneNumber || null,
        contactsCount,
        activeContactsCount,
        wishesSentCount,
        wishesTotalCount,
        templatesCount,
        isSuspended,
        isActivated,
        isAtRisk,
        autoSendContactsCount,
        fixedModeContactsCount,
        templateModeContactsCount,
        aiModeContactsCount,
      };

      return userRecord;
    });

    const users = await Promise.all(userPromises);

    // Sort newest registrations first
    users.sort((a, b) => b.createdAtMs - a.createdAtMs);

    // Aggregate summary metrics
    const totalUsers = users.length;
    const newUsersLast7Days = users.filter(u => u.createdAtMs >= sevenDaysAgo).length;
    const newUsersLast30Days = users.filter(u => u.createdAtMs >= thirtyDaysAgo).length;
    const whatsappConnectedCount = users.filter(u => u.whatsappStatus === 'connected').length;
    const whatsappConnectedRate = totalUsers > 0 ? Math.round((whatsappConnectedCount / totalUsers) * 100) : 0;
    
    const totalContacts = users.reduce((acc, u) => acc + u.contactsCount, 0);
    const totalActiveContacts = users.reduce((acc, u) => acc + u.activeContactsCount, 0);
    const totalWishesSent = users.reduce((acc, u) => acc + u.wishesSentCount, 0);
    const totalTemplates = users.reduce((acc, u) => acc + u.templatesCount, 0);
    const avgContactsPerUser = totalUsers > 0 ? Math.round((totalContacts / totalUsers) * 10) / 10 : 0;

    const activatedUsersCount = users.filter(u => u.isActivated).length;
    const activatedUsersRate = totalUsers > 0 ? Math.round((activatedUsersCount / totalUsers) * 100) : 0;
    const atRiskUsersCount = users.filter(u => u.isAtRisk).length;

    const totalAutoSendContacts = users.reduce((acc, u) => acc + u.autoSendContactsCount, 0);
    const autoSendContactsRate = totalContacts > 0 ? Math.round((totalAutoSendContacts / totalContacts) * 100) : 0;

    const totalFixedModeContacts = users.reduce((acc, u) => acc + u.fixedModeContactsCount, 0);
    const fixedModeContactsRate = totalContacts > 0 ? Math.round((totalFixedModeContacts / totalContacts) * 100) : 0;

    const totalTemplateModeContacts = users.reduce((acc, u) => acc + u.templateModeContactsCount, 0);
    const templateModeContactsRate = totalContacts > 0 ? Math.round((totalTemplateModeContacts / totalContacts) * 100) : 0;

    const totalAiModeContacts = users.reduce((acc, u) => acc + u.aiModeContactsCount, 0);
    const aiModeContactsRate = totalContacts > 0 ? Math.round((totalAiModeContacts / totalContacts) * 100) : 0;

    return {
      success: true,
      data: {
        summary: {
          totalUsers,
          newUsersLast7Days,
          newUsersLast30Days,
          whatsappConnectedCount,
          whatsappConnectedRate,
          totalContacts,
          totalActiveContacts,
          totalWishesSent,
          totalTemplates,
          avgContactsPerUser,
          activatedUsersCount,
          activatedUsersRate,
          atRiskUsersCount,
          autoSendContactsRate,
          totalFixedModeContacts,
          fixedModeContactsRate,
          totalTemplateModeContacts,
          templateModeContactsRate,
          totalAiModeContacts,
          aiModeContactsRate,
          totalFailedWishes,
        },
        users,
      },
    };
  } catch (error: any) {
    console.error('getAdminAnalyticsDataAction error:', error);
    return {
      success: false,
      error: error.message || 'Error al obtener datos de analítica',
    };
  }
}

/**
 * Fetches all global wishes from top-level wishes collection for auditing & error monitoring
 */
export async function getAdminGlobalWishesAction(): Promise<{
  success: boolean;
  wishes?: AdminWishRecord[];
  error?: string;
}> {
  try {
    await verifyAdminAuth();

    const wishesSnap = await adminDb
      .collection('wishes')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get()
      .catch(() => ({ docs: [] } as any));

    const usersSnap = await adminDb.collection('users').get();
    const userMap = new Map<string, { name: string; email: string }>();
    usersSnap.docs.forEach(d => {
      const data = d.data();
      userMap.set(d.id, {
        name: data.displayName || data.name || 'Usuario',
        email: data.email || 'Sin correo',
      });
    });

    const wishes: AdminWishRecord[] = wishesSnap.docs.map((doc: any) => {
      const w = doc.data();
      const user = userMap.get(w.userId) || { name: 'Desconocido', email: 'Sin correo' };

      let schedStr = 'Hoy';
      if (w.scheduledFor) {
        if (typeof w.scheduledFor.toDate === 'function') {
          schedStr = w.scheduledFor.toDate().toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
        } else if (w.scheduledFor._seconds) {
          schedStr = new Date(w.scheduledFor._seconds * 1000).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
        }
      }

      let sentStr: string | undefined;
      if (w.sentAt) {
        if (typeof w.sentAt.toDate === 'function') {
          sentStr = w.sentAt.toDate().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        } else if (w.sentAt._seconds) {
          sentStr = new Date(w.sentAt._seconds * 1000).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        }
      }

      return {
        id: doc.id,
        userId: w.userId,
        userName: user.name,
        userEmail: user.email,
        contactId: w.contactId,
        contactName: w.contactName || 'Contacto',
        contactPhone: w.contactPhone || '',
        status: w.status || 'pending',
        mode: w.mode || 'manual',
        message: w.generatedMessage || w.customMessage || 'Sin mensaje',
        scheduledFor: schedStr,
        sentAt: sentStr,
        errorMessage: w.errorMessage,
      };
    });

    return { success: true, wishes };
  } catch (error: any) {
    console.error('getAdminGlobalWishesAction error:', error);
    return { success: false, error: error.message || 'Error al obtener felicitaciones' };
  }
}

/**
 * Diagnostic test to check WhatsApp connection state directly in Evolution API
 */
export async function adminTestWhatsAppInstanceAction(targetUserId: string): Promise<{
  success: boolean;
  state?: string;
  phone?: string | null;
  message?: string;
  error?: string;
}> {
  try {
    await verifyAdminAuth();
    const instanceName = `autocumple-${targetUserId}`;

    const res: any = await evolutionApi.getConnectionState(instanceName).catch(() => null);
    const state = res?.instance?.state || 'disconnected';
    
    return {
      success: true,
      state,
      phone: res?.instance?.phoneNumber || null,
      message: state === 'open' ? 'WhatsApp está conectado y operativo en el servidor.' : `Estado en servidor: ${state}`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al contactar con el servidor de WhatsApp.',
    };
  }
}

/**
 * Restarts a user's WhatsApp instance in Evolution API to clear stuck sockets
 */
export async function adminRestartWhatsAppInstanceAction(targetUserId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await verifyAdminAuth();
    const instanceName = `autocumple-${targetUserId}`;

    await evolutionApi.restartInstance(instanceName);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al reiniciar la instancia de WhatsApp.',
    };
  }
}

/**
 * Suspends or reactivates a user account
 */
export async function adminToggleUserStatusAction(targetUserId: string, isSuspended: boolean): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const adminUid = await verifyAdminAuth();
    if (targetUserId === adminUid) {
      return { success: false, error: 'No puedes suspender tu propia cuenta de administrador.' };
    }

    await adminDb.collection('users').doc(targetUserId).set({
      isSuspended,
      updatedAt: new Date(),
    }, { merge: true });

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al actualizar estado del usuario',
    };
  }
}

/**
 * Retries sending a failed or queued wish immediately
 */
export async function adminRetryWishAction(wishId: string, targetUserId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await verifyAdminAuth();

    await adminDb.collection('wishes').doc(wishId).update({
      status: 'queued',
      scheduledFor: new Date(Date.now() - 1000),
      errorMessage: null,
    });

    await executeSendWishes();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al reintentar envío' };
  }
}

/**
 * Deletes user and performs a full cascade cleanup across all services
 */
export async function adminDeleteUserAction(targetUserId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const adminUid = await verifyAdminAuth();

    if (!targetUserId) {
      return { success: false, error: 'ID de usuario inválido' };
    }

    if (targetUserId === adminUid) {
      return { success: false, error: 'No puedes eliminar tu propia cuenta de administrador desde aquí.' };
    }

    // Verify target user is not admin email
    const targetDoc = await adminDb.collection('users').doc(targetUserId).get();
    if (targetDoc.exists) {
      const targetEmail = (targetDoc.data()?.email || '').toLowerCase().trim();
      if (ADMIN_EMAILS.includes(targetEmail)) {
        return { success: false, error: 'No se puede eliminar una cuenta de administrador.' };
      }
    }

    // 0. Mark user as deleted in Firestore first so incoming webhook events immediately abort
    await adminDb.collection('users').doc(targetUserId).set({
      isDeleted: true,
      isDeleting: true,
    }, { merge: true }).catch(() => {});

    // 1. Delete WhatsApp Evolution API instance
    try {
      await evolutionApi.deleteInstance(`autocumple-${targetUserId}`).catch(() => {});
    } catch {}

    // 2. Cascade delete subcollections
    const subcollections = ['contacts', 'wishes', 'templates', 'wa_contacts_cache'];
    for (const sub of subcollections) {
      try {
        const snap = await adminDb.collection('users').doc(targetUserId).collection(sub).get();
        if (!snap.empty) {
          const batch = adminDb.batch();
          snap.docs.forEach(d => batch.delete(d.ref));
          await batch.commit();
        }
      } catch {}
    }

    // 3. Delete any global wishes
    try {
      const globalWishes = await adminDb.collection('wishes').where('userId', '==', targetUserId).get();
      if (!globalWishes.empty) {
        const batch = adminDb.batch();
        globalWishes.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    } catch {}

    // 4. Delete user document from Firestore
    await adminDb.collection('users').doc(targetUserId).delete();

    // 5. Delete user from Firebase Authentication
    try {
      await adminAuth.deleteUser(targetUserId);
    } catch (authErr: any) {
      console.warn(`[AdminDelete] Auth deletion note for ${targetUserId}:`, authErr?.message);
    }

    return { success: true };
  } catch (error: any) {
    console.error('adminDeleteUserAction error:', error);
    return {
      success: false,
      error: error.message || 'Error al eliminar usuario',
    };
  }
}

export async function getAdminSystemTelemetryAction(): Promise<{
  success: boolean;
  data?: AdminSystemTelemetry;
  error?: string;
}> {
  try {
    await verifyAdminAuth();

    // 1. Server & Node.js Memory Telemetry
    const memUsage = process.memoryUsage();
    const heapUsedMb = Math.round((memUsage.heapUsed / 1024 / 1024) * 10) / 10;
    const heapTotalMb = Math.round((memUsage.heapTotal / 1024 / 1024) * 10) / 10;
    const rssMb = Math.round((memUsage.rss / 1024 / 1024) * 10) / 10;
    const externalMb = Math.round((memUsage.external / 1024 / 1024) * 10) / 10;
    const systemTotalRamMb = Math.round(os.totalmem() / 1024 / 1024);
    const systemFreeRamMb = Math.round(os.freemem() / 1024 / 1024);
    const heapUsagePercent = heapTotalMb > 0 ? Math.round((heapUsedMb / heapTotalMb) * 100) : 0;

    // 2. VPS & Evolution API Telemetry
    const startPing = Date.now();
    let vpsStatus: 'online' | 'degraded' | 'offline' = 'offline';
    let latencyMs = 0;
    let instances: any[] = [];
    const evolutionUrl = process.env.EVOLUTION_API_URL || 'http://localhost:8080';

    try {
      instances = await evolutionApi.fetchInstances();
      latencyMs = Date.now() - startPing;
      vpsStatus = latencyMs < 900 ? 'online' : 'degraded';
    } catch {
      latencyMs = Date.now() - startPing;
      vpsStatus = 'offline';
    }

    let connectedCount = 0;
    let connectingCount = 0;
    let disconnectedCount = 0;
    const instancesList: Array<{ name: string; status: string; ownerPhone?: string }> = [];

    for (const inst of (instances || [])) {
      const state = inst.instance?.state || inst.state || 'close';
      const name = inst.instance?.instanceName || inst.name || 'instance';
      const ownerPhone = inst.instance?.owner || inst.owner || undefined;

      if (state === 'open') connectedCount++;
      else if (state === 'connecting') connectingCount++;
      else disconnectedCount++;

      instancesList.push({
        name,
        status: state,
        ownerPhone,
      });
    }

    // 3. AI / Gemini Tokens Telemetry
    const wishesSnap = await adminDb.collection('wishes').get().catch(() => ({ docs: [] } as any));
    const allWishes = wishesSnap.docs.map((d: any) => d.data());
    
    // Count AI generated wishes
    const aiWishes = allWishes.filter((w: any) => w.mode === 'ai' || (w.aiTone && w.generatedMessage));
    const totalAiWishes = aiWishes.length;

    // A standard Gemini prompt for wish generation uses ~220 input tokens & ~55 output tokens
    const PROMPT_TOKENS_PER_WISH = 220;
    const COMPLETION_TOKENS_PER_WISH = 55;
    const TOTAL_TOKENS_PER_WISH = PROMPT_TOKENS_PER_WISH + COMPLETION_TOKENS_PER_WISH;

    const estimatedPromptTokens = totalAiWishes * PROMPT_TOKENS_PER_WISH;
    const estimatedCompletionTokens = totalAiWishes * COMPLETION_TOKENS_PER_WISH;
    const totalTokens = estimatedPromptTokens + estimatedCompletionTokens;

    // Gemini 2.5/3.6 Flash Pricing: $0.075 / 1M prompt tokens, $0.30 / 1M completion tokens
    const estimatedCostUsd = (estimatedPromptTokens * 0.000000075) + (estimatedCompletionTokens * 0.00000030);
    const estimatedCostEur = estimatedCostUsd * 0.92;

    const isGeminiConfigured = Boolean(process.env.GEMINI_API_KEY);

    // 4. Firestore Database Telemetry
    const usersSnap = await adminDb.collection('users').get().catch(() => ({ size: 0, docs: [] } as any));
    const templatesSnap = await adminDb.collection('templates').get().catch(() => ({ size: 0 } as any));
    
    let totalContactsCount = 0;
    const usersDocs = usersSnap.docs || [];
    for (const u of usersDocs.slice(0, 100)) {
      const cSnap = await adminDb.collection('users').doc(u.id).collection('contacts').get().catch(() => ({ size: 0 }));
      totalContactsCount += cSnap.size;
    }

    const totalUsersCount = usersSnap.size || 0;
    const totalWishesCount = wishesSnap.docs.length || 0;
    const totalTemplatesCount = templatesSnap.size || 0;

    // Estimated storage: ~1.5 KB per contact/wish doc
    const totalDocs = totalUsersCount + totalContactsCount + totalWishesCount + totalTemplatesCount;
    const estimatedStorageMb = Math.round(((totalDocs * 1.8) / 1024) * 10) / 10;

    return {
      success: true,
      data: {
        timestamp: Date.now(),
        server: {
          nodeVersion: process.version,
          platform: os.platform(),
          arch: os.arch(),
          uptimeSeconds: Math.round(process.uptime()),
          memory: {
            heapUsedMb,
            heapTotalMb,
            rssMb,
            externalMb,
            systemTotalRamMb,
            systemFreeRamMb,
            heapUsagePercent,
          },
          loadAvg: os.loadavg(),
          environment: process.env.NODE_ENV || 'production',
        },
        vps: {
          status: vpsStatus,
          latencyMs,
          apiUrl: evolutionUrl.replace(/^(https?:\/\/)([^@]+@)?([^\/:]+)(.*)$/, '$1$3$4'),
          totalInstances: (instances || []).length,
          connectedInstances: connectedCount,
          connectingInstances: connectingCount,
          disconnectedInstances: disconnectedCount,
          instancesList,
        },
        aiTokens: {
          model: 'Gemini 2.5 Flash / 3.6 Flash',
          totalAiWishes,
          estimatedPromptTokens,
          estimatedCompletionTokens,
          totalTokens,
          estimatedCostUsd: Math.round(estimatedCostUsd * 100000) / 100000,
          estimatedCostEur: Math.round(estimatedCostEur * 100000) / 100000,
          avgTokensPerWish: TOTAL_TOKENS_PER_WISH,
          geminiStatus: isGeminiConfigured ? 'healthy' : 'unconfigured',
        },
        firestore: {
          status: 'healthy',
          totalUsersCount,
          totalContactsCount,
          totalWishesCount,
          totalTemplatesCount,
          estimatedStorageMb,
        },
      },
    };
  } catch (error: any) {
    console.error('getAdminSystemTelemetryAction error:', error);
    return {
      success: false,
      error: error.message || 'Error al obtener telemetría del sistema',
    };
  }
}
