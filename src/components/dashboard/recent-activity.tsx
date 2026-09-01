"use client";

import Link from "next/link";
import { CheckCircle2, XCircle, Clock, Send, ArrowRight } from "lucide-react";

export interface ActivityWishItem {
  id: string;
  contactName: string;
  message: string;
  status: string;
  timeStr: string;
}

interface RecentActivityProps {
  activity: ActivityWishItem[];
}

export function RecentActivity({ activity }: RecentActivityProps) {
  return (
    <div className="rounded-3xl bg-white/70 backdrop-blur-md border border-white/40 shadow-sm overflow-hidden flex flex-col justify-between">
      <div className="p-5 border-b border-slate-100/80 flex items-center justify-between gap-2">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 min-w-0">
          <Send className="w-4 h-4 text-violet-600 shrink-0" />
          <span className="truncate">Felicitaciones Recientes</span>
        </h3>
        <Link 
          href="/wishes" 
          className="text-xs font-bold text-violet-600 hover:text-violet-700 inline-flex items-center gap-1 shrink-0 whitespace-nowrap"
        >
          <span>Ver cola</span>
          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
        </Link>
      </div>
      
      <div className="p-3 flex-1">
        {activity.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {activity.map((item) => (
              <div key={item.id} className="flex gap-3.5 p-3 rounded-2xl hover:bg-white/90 transition-all border border-transparent hover:border-slate-100">
                <div className="mt-0.5 shrink-0">
                  {item.status === "sent" && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                  {item.status === "failed" && <XCircle className="w-5 h-5 text-rose-500" />}
                  {item.status === "waiting_approval" && <Clock className="w-5 h-5 text-amber-500" />}
                  {item.status === "queued" && <Clock className="w-5 h-5 text-blue-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-slate-900 text-sm truncate">{item.contactName}</p>
                    <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">{item.timeStr}</span>
                  </div>
                  <p className="text-xs text-slate-600 truncate mt-0.5 font-medium">{item.message}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center space-y-2">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">Sin actividad reciente</p>
            <p className="text-xs text-slate-500">Las felicitaciones generadas y enviadas aparecerán aquí.</p>
          </div>
        )}
      </div>
    </div>
  );
}
