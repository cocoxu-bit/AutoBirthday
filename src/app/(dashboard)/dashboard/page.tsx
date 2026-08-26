import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { getContacts, getWishes } from "@/lib/firebase/firestore";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { UpcomingBirthdays, UpcomingBirthdayItem } from "@/components/dashboard/upcoming-birthdays";
import { RecentActivity, ActivityWishItem } from "@/components/dashboard/recent-activity";
import { Smartphone, UserPlus, FileText, Sparkles, Cake } from "lucide-react";

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
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userId = decodedClaims.uid;

    const [userDoc, contacts, wishes] = await Promise.all([
      adminDb.collection('users').doc(userId).get(),
      getContacts(userId),
      getWishes(userId),
    ]);

    const userData = userDoc.data();
    const displayName = userData?.displayName || decodedClaims.name || decodedClaims.email?.split('@')[0] || 'Usuario';
    const isWhatsAppConnected = userData?.whatsappInstance?.status === 'connected';

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
      dateStr: item.dateStr,
      daysRemaining: item.daysRemaining,
      isGroup: item.contact.targetType === 'group',
      groupName: item.contact.groupName,
      mode: item.contact.mode,
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
      stats: {
        activeContacts: activeContacts.length,
        sentTotal,
        pendingApproval,
        nextBirthdayDays: nextBirthday ? nextBirthday.daysRemaining : null,
        nextBirthdayName: nextBirthday ? `${nextBirthday.contact.name} (${nextBirthday.contact.birthDay} ${MONTH_NAMES[nextBirthday.contact.birthMonth - 1]})` : undefined,
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
  const currentDate = format(new Date(), "EEEE, d 'de' MMMM", { locale: es });

  return (
    <div className="space-y-8 pb-20 md:pb-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/70 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-white/60 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100/80 text-violet-700 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Panel Inteligente</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            ¡Hola, {data?.displayName || 'Bienvenido'}! 👋
          </h1>
          <p className="text-slate-500 capitalize text-xs font-semibold mt-1">{currentDate}</p>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          <Link
            href="/whatsapp"
            className={`col-span-2 sm:col-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
              data?.isWhatsAppConnected
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>{data?.isWhatsAppConnected ? 'WhatsApp Conectado ✅' : 'Conectar WhatsApp ⚠️'}</span>
          </Link>

          <Link
            href="/contacts/new"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-all shadow-sm shadow-violet-500/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>Añadir Contacto</span>
          </Link>

          <Link
            href="/templates/new"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all shadow-sm"
          >
            <FileText className="w-4 h-4" />
            <span>Nueva Plantilla</span>
          </Link>
        </div>
      </div>

      {/* WhatsApp banner if not connected */}
      {!data?.isWhatsAppConnected && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-5 sm:p-6 text-white shadow-xl shadow-emerald-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Vincula tu cuenta de WhatsApp
            </h3>
            <p className="text-emerald-100 text-xs max-w-xl font-medium">
              Conecta tu número con código de 8 dígitos o QR para enviar felicitaciones automáticas y recibir avisos de aprobación.
            </p>
          </div>
          <Link
            href="/whatsapp"
            className="inline-flex items-center justify-center px-5 py-3 rounded-2xl bg-white text-emerald-900 font-bold text-xs hover:bg-emerald-50 transition-all shrink-0 shadow-md"
          >
            Vincular WhatsApp ➔
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <StatsCards 
        stats={data?.stats || {
          activeContacts: 0,
          sentTotal: 0,
          pendingApproval: 0,
          nextBirthdayDays: null,
        }} 
      />

      {/* Main Grid: Upcoming Birthdays + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingBirthdays birthdays={data?.upcomingList || []} />
        <RecentActivity activity={data?.activityList || []} />
      </div>
    </div>
  );
}
