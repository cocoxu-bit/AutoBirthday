import { Users, Cake, Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";

interface StatsCardsProps {
  stats: {
    activeContacts: number;
    sentTotal: number;
    pendingApproval: number;
    nextBirthdayDays: number | null;
    nextBirthdayName?: string;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const { t } = useTranslation();

  const getNextBirthdayText = () => {
    if (stats.nextBirthdayDays === null) return "-";
    if (stats.nextBirthdayDays === 0) return `${t('dashboard.today')} 🎉`;
    if (stats.nextBirthdayDays === 1) return t('dashboard.tomorrow');
    return t('dashboard.inDays').replace('{days}', stats.nextBirthdayDays.toString());
  };

  const items = [
    {
      label: t('dashboard.totalBirthdays'),
      value: stats.activeContacts.toString(),
      trend: stats.activeContacts > 0 ? t('dashboard.totalBirthdaysDesc') : t('dashboard.addContact'),
      icon: Users,
      color: "text-violet-600",
      bgColor: "bg-violet-100",
    },
    {
      label: t('dashboard.sentTitle'),
      value: stats.sentTotal.toString(),
      trend: t('dashboard.sentDesc'),
      icon: Cake,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      label: t('dashboard.pendingTitle'),
      value: stats.pendingApproval.toString(),
      trend: stats.pendingApproval > 0 ? t('dashboard.pendingDesc') : "OK ✅",
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      label: t('dashboard.upcomingTitle'),
      value: getNextBirthdayText(),
      trend: stats.nextBirthdayName || t('dashboard.noUpcoming'),
      icon: Calendar,
      color: "text-rose-600",
      bgColor: "bg-rose-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
      {items.map((stat, i) => (
        <div
          key={i}
          className="p-4 sm:p-5 rounded-3xl bg-white/80 backdrop-blur-md border border-white/60 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 leading-tight">
              {stat.label}
            </p>
            <div className={cn("p-2 sm:p-2.5 rounded-2xl shrink-0", stat.bgColor)}>
              <stat.icon className={cn("w-4 h-4 sm:w-5 sm:h-5", stat.color)} />
            </div>
          </div>
          <div className="mt-3 sm:mt-4 space-y-1">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
              {stat.value}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 font-semibold leading-snug">
              {stat.trend}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
