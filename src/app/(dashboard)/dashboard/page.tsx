import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { getContacts, getWishes } from "@/lib/firebase/firestore";
import { evolutionApi } from "@/lib/evolution-api/client";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { UpcomingBirthdays, UpcomingBirthdayItem } from "@/components/dashboard/upcoming-birthdays";
import { RecentActivity, ActivityWishItem } from "@/components/dashboard/recent-activity";
import { ConnectionStatusCard } from "@/components/dashboard/connection-status-card";
import { OnboardingChecklist } from "@/components/onboarding/onboarding-checklist";
import { Smartphone, UserPlus, Users, FileText, Sparkles, Cake, Gift, ArrowRight } from "lucide-react";
import { getServerTranslations } from "@/lib/i18n/server";

export const dynamic = 'force-dynamic';

const MONTH_NAMES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

async function getDashboardData() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;
    if (!sessionCookie) return null;
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, false);
    const userId = decodedClaims.uid;

    const [userDoc, contacts, wishes] = await Promise.all([
      adminDb.collection('users').doc(userId).get(),
      getContacts(userId),
      getWishes(userId),
    ]);

    const userData = userDoc.data();
    const displayName = userData?.displayName || decodedClaims.name || decodedClaims.email?.split('@')[0] || 'Usuario';
    
    let isWhatsAppConnected = userData?.whatsappInstance?.status === 'connected';
    if (!isWhatsAppConnected) {
      try {
        const evo = await evolutionApi.getConnectionState(`autocumple-${userId}`);
        if (evo.instance?.state === 'open') {
          isWhatsAppConnected = true;
          adminDb.collection('users').doc(userId).set({
            whatsappInstance: {
              status: 'connected',
              updatedAt: new Date(),
            }
          }, { merge: true }).catch(() => {});
        }
      } catch {}
    }

    // 1. Compute Stats
    const activeContacts = contacts.filter(c => c.isActive);
    const sentTotal = wishes.filter(w => w.status === 'sent').length;
    const pendingApproval = wishes.filter(w => w.status === 'waiting_approval').length;

    // 2. Compute Upcoming Birthdays
    const now = new Date();
    const currentYear = now.getFullYear();
    const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const contactsWithDays: Array<{
      contact: typeof contacts[0];
      daysRemaining: number;
      dateStr: string;
    }> = [];

    for (const c of activeContacts) {
      if (!c.birthDay || !c.birthMonth) continue;

      let nextDate = new Date(currentYear, c.birthMonth - 1, c.birthDay);
      if (nextDate < todayZero) {
        // Birthday already passed this year, next one is next year
        nextDate = new Date(currentYear + 1, c.birthMonth - 1, c.birthDay);
      }

      const diffTime = nextDate.getTime() - todayZero.getTime();
      const daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));

      contactsWithDays.push({
        contact: c,
        daysRemaining,
        dateStr: `${c.birthDay} ${MONTH_NAMES[c.birthMonth - 1]} ${c.birthYear ? `(${currentYear - c.birthYear} años)` : ''}`,
      });
    }

    contactsWithDays.sort((a, b) => a.daysRemaining - b.daysRemaining);

    const nextBirthday = contactsWithDays[0];
    const upcomingList: UpcomingBirthdayItem[] = contactsWithDays.slice(0, 6).map(item => ({
      id: item.contact.id || Math.random().toString(),
      name: item.contact.name,
      phone: item.contact.phone,
      birthDay: item.contact.birthDay,
      birthMonth: item.contact.birthMonth,
      birthYear: item.contact.birthYear,
      dateStr: item.dateStr,
      daysRemaining: item.daysRemaining,
      isGroup: item.contact.targetType === 'group',
      groupName: item.contact.groupName,
      mode: item.contact.mode,
      profilePictureUrl: item.contact.profilePictureUrl || null,
    }));

    // 3. Compute Recent Activity
    const parseTime = (val: any): number => {
      if (!val) return 0;
      if (typeof val?.toDate === 'function') return val.toDate().getTime();
      return new Date(val).getTime();
    };

    const contactsMap = new Map(contacts.map(c => [c.id, c]));
    const recentWishes = [...wishes].sort((a, b) => {
      return parseTime(b.createdAt) - parseTime(a.createdAt);
    }).slice(0, 5);

    const activityList: ActivityWishItem[] = recentWishes.map(w => {
      const contact = contactsMap.get(w.contactId);
      const contactName = contact?.name || w.groupName || 'Contacto';
      let timeStr = 'Reciente';
      try {
        const d = (w.createdAt as any)?.toDate ? (w.createdAt as any).toDate() : new Date(w.createdAt as any);
        timeStr = format(d, "d MMM, HH:mm", { locale: es });
      } catch {}

      return {
        id: w.id,
        contactName,
        message: w.generatedMessage || 'Felicitación programada',
        status: w.status,
        timeStr,
      };
    });

    return {
      displayName,
      isWhatsAppConnected,
      hasReceivedWelcomeMessage: Boolean(userData?.hasReceivedWelcomeMessage),
      stats: {
        activeContacts: activeContacts.length,
        sentTotal,
        pendingApproval,
        nextBirthdayDays: nextBirthday ? nextBirthday.daysRemaining : null,
        nextBirthdayName: nextBirthday ? `${nextBirthday.contact.name} (${nextBirthday.contact.birthDay} ${MONTH_NAMES[nextBirthday.contact.birthMonth - 1]})` : undefined,
        nextBirthdayContact: nextBirthday ? {
          name: nextBirthday.contact.name,
          birthDay: nextBirthday.contact.birthDay,
          birthMonth: nextBirthday.contact.birthMonth,
        } : undefined,
      },
      upcomingList,
      activityList,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return null;
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const { t } = await getServerTranslations();

  return (
    <div className="space-y-6 pb-20 md:pb-6 max-w-7xl mx-auto">
      {/* High-priority alert banner when WhatsApp is disconnected */}
      {!data?.isWhatsAppConnected && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/20 via-red-500/15 to-rose-500/20 border-2 border-red-400/80 rounded-3xl backdrop-blur-md shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse-slow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-md">
              ⚠️
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">{t('dashboard.whatsappDisconnectedTitle')}</h4>
              <p className="text-xs text-slate-600 font-medium">{t('dashboard.whatsappDisconnectedDesc')}</p>
            </div>
          </div>
          <Link
            href="/whatsapp"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/30 shrink-0 self-end sm:self-center whitespace-nowrap"
          >
            <span>{t('dashboard.connectButton')}</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </Link>
        </div>
      )}

      {/* Prominent Onboarding Step 2: When WhatsApp is connected but has 0 contacts */}
      {data?.isWhatsAppConnected && (data?.stats?.activeContacts === 0) && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-violet-500/15 border-2 border-emerald-400/80 rounded-3xl backdrop-blur-md shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-md">
              🎉
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-slate-900">{t('whatsapp.connectedSuccess')}</h4>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                {t('dashboard.subtitle')}
              </p>
            </div>
          </div>
          <Link
            href="/contacts?sync=whatsapp"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-600/25 shrink-0 self-end sm:self-center whitespace-nowrap"
          >
            <span>{t('dashboard.syncButton')}</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </Link>
        </div>
      )}

      {/* Revolut / Airbnb Style Onboarding Checklist */}
      <OnboardingChecklist
        isWhatsAppConnected={Boolean(data?.isWhatsAppConnected)}
        contactsCount={data?.stats?.activeContacts || 0}
        hasReceivedWelcome={Boolean(data?.hasReceivedWelcomeMessage)}
      />

      {/* WhatsApp Connection Health Monitor (Only appears if disconnected/connecting) */}
      <ConnectionStatusCard 
        initialStatus={data?.isWhatsAppConnected ? 'connected' : 'disconnected'} 
      />

      {/* Top Stats Section: 4 Cards Full Width (2x2 on mobile, 4-col on desktop) */}
      <StatsCards 
        stats={data?.stats || {
          activeContacts: 0,
          sentTotal: 0,
          pendingApproval: 0,
          nextBirthdayDays: null,
        }} 
      />

      {/* Quick Action Cards: 3 Columns on Desktop, Stacked on Mobile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
        <Link
          href="/contacts"
          className="group flex items-center justify-between p-4 sm:p-5 rounded-3xl bg-white/80 hover:bg-white backdrop-blur-md border border-white/60 hover:border-violet-300 shadow-xs hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20 shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-violet-700 transition-colors">
                {t('contacts.title')}
              </h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">
                {t('contacts.subtitle')}
              </p>
            </div>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 group-hover:bg-violet-100 text-slate-400 group-hover:text-violet-700 flex items-center justify-center shrink-0 transition-colors ml-2">
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        <Link
          href="/wishes"
          className="group flex items-center justify-between p-4 sm:p-5 rounded-3xl bg-white/80 hover:bg-white backdrop-blur-md border border-white/60 hover:border-rose-300 shadow-xs hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20 shrink-0 group-hover:scale-105 transition-transform">
              <Cake className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-rose-700 transition-colors">
                {t('wishes.title')}
              </h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">
                {t('wishes.subtitle')}
              </p>
            </div>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 group-hover:bg-rose-100 text-slate-400 group-hover:text-rose-700 flex items-center justify-center shrink-0 transition-colors ml-2">
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        <Link
          href="/templates"
          className="group flex items-center justify-between p-4 sm:p-5 rounded-3xl bg-white/80 hover:bg-white backdrop-blur-md border border-white/60 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-indigo-700 transition-colors">
                {t('templates.title')}
              </h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">
                {t('templates.subtitle')}
              </p>
            </div>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 group-hover:bg-indigo-100 text-slate-400 group-hover:text-indigo-700 flex items-center justify-center shrink-0 transition-colors ml-2">
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Main Grid: Upcoming Birthdays + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <UpcomingBirthdays birthdays={data?.upcomingList || []} />
        <RecentActivity activity={data?.activityList || []} />
      </div>
    </div>
  );
}
