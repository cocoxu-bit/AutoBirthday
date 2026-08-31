"use client";

import Link from "next/link";
import { Cake, ArrowRight, UserPlus, Users } from "lucide-react";

export interface UpcomingBirthdayItem {
  id: string;
  name: string;
  phone: string;
  dateStr: string;
  daysRemaining: number;
  isGroup?: boolean;
  groupName?: string;
  mode?: string;
  profilePictureUrl?: string | null;
}

interface UpcomingBirthdaysProps {
  birthdays: UpcomingBirthdayItem[];
}

export function UpcomingBirthdays({ birthdays }: UpcomingBirthdaysProps) {
  return (
    <div className="rounded-3xl bg-white/70 backdrop-blur-md border border-white/40 shadow-sm overflow-hidden flex flex-col justify-between">
      <div className="p-5 border-b border-slate-100/80 flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Cake className="w-5 h-5 text-rose-500" />
          Próximos Cumpleaños 🎂
        </h3>
        <Link 
          href="/contacts" 
          className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1"
        >
          <span>Ver todos</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      
      <div className="p-3 flex-1">
        {birthdays.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {birthdays.map((bday) => (
              <div 
                key={bday.id} 
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/90 transition-all border border-transparent hover:border-slate-100"
              >
                <div className="flex items-center gap-3">
                  {bday.profilePictureUrl ? (
                    <img 
                      src={bday.profilePictureUrl} 
                      alt={bday.name}
                      className="w-10 h-10 rounded-2xl object-cover shadow-sm ring-1 ring-slate-200/80 shrink-0" 
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs text-white shadow-sm shrink-0 ${
                      bday.isGroup ? 'bg-emerald-500' : 'bg-gradient-to-br from-violet-500 to-fuchsia-500'
                    }`}>
                      {bday.isGroup ? <Users className="w-4 h-4" /> : (bday.name ? bday.name.substring(0, 2).toUpperCase() : 'WA')}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      {bday.name}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">{bday.dateStr}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                    bday.daysRemaining === 0 
                      ? 'bg-rose-100 text-rose-700 animate-bounce' 
                      : bday.daysRemaining <= 3 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-violet-100 text-violet-700'
                  }`}>
                    {bday.daysRemaining === 0 
                      ? '¡Hoy! 🎉' 
                      : bday.daysRemaining === 1 
                        ? 'Mañana' 
                        : `En ${bday.daysRemaining} días`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Cake className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">No hay cumpleaños próximos en 30 días</p>
              <p className="text-xs text-slate-500 mt-0.5">Añade contactos o importa tu calendario para verlos aquí.</p>
            </div>
            <Link 
              href="/contacts/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold hover:bg-violet-700 transition-colors shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Añadir Cumpleaños</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
