"use client";

import { Users, Send, Clock, Cake } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const items = [
    {
      label: "Contactos Activos",
      value: stats.activeContacts.toString(),
      trend: stats.activeContacts > 0 ? "Listos para felicitar" : "Añade contactos",
      icon: Users,
      color: "text-violet-600",
      bgColor: "bg-violet-100",
    },
    {
      label: "Felicitaciones",
      value: stats.sentTotal.toString(),
      trend: "Total enviadas",
      icon: Send,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      label: "Pendientes",
      value: stats.pendingApproval.toString(),
      trend: stats.pendingApproval > 0 ? "Por revisar" : "Todo al día ✅",
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      label: "Próximo Cumple",
      value: stats.nextBirthdayDays !== null 
        ? stats.nextBirthdayDays === 0 ? "¡HOY! 🎉" : `En ${stats.nextBirthdayDays} d`
        : "-",
      trend: stats.nextBirthdayName || "Sin cumpleaños",
      icon: Cake,
      color: "text-rose-600",
      bgColor: "bg-rose-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {items.map((stat, i) => (
        <div
          key={i}
          className="p-4 sm:p-5 rounded-3xl bg-white/70 backdrop-blur-md border border-white/40 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">{stat.label}</p>
            <div className={cn("p-2 sm:p-2.5 rounded-2xl shrink-0", stat.bgColor)}>
              <stat.icon className={cn("w-4 h-4 sm:w-5 sm:h-5", stat.color)} />
            </div>
          </div>
          <div className="mt-3 sm:mt-4 flex flex-col gap-0.5">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">{stat.value}</h3>
            <p className="text-[11px] sm:text-xs text-slate-500 font-semibold truncate">{stat.trend}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
