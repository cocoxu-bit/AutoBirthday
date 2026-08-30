'use server';

import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

const ADMIN_EMAILS = [
  'lucasjimeneznavarro@gmail.com',
];

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
      const wishesSentCount = wishes.filter((w: any) => w.status === 'sent').length;
      const wishesTotalCount = wishes.length;
      const templatesCount = templatesSnap.docs.length;

      const waStatus: 'connected' | 'disconnected' | 'qrcode' = 
        u.whatsappInstance?.status === 'connected' ? 'connected' :
        u.whatsappInstance?.status === 'qrcode' ? 'qrcode' : 'disconnected';

      const userRecord: AdminUserRecord = {
        id: userId,
        email: u.email || 'Sin correo',
        displayName: u.displayName || u.name || 'Usuario',
        photoURL: u.photoURL || null,
        createdAt: createdAtStr,
        createdAtMs,
        whatsappStatus: waStatus,
        whatsappPhone: u.whatsappInstance?.phoneNumber || null,
        contactsCount,
        activeContactsCount,
        wishesSentCount,
        wishesTotalCount,
        templatesCount,
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
