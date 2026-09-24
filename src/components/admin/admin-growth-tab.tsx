'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  TrendingUp, 
  Users, 
  Calendar, 
  Share2, 
  ExternalLink, 
  Trophy, 
  PartyPopper,
  Smartphone,
  Eye,
  CheckCircle2,
  Copy
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/whatsapp-icon';
import { InstagramIcon, TikTokIcon } from '@/components/ui/social-icons';
import { AdminGrowthData } from '@/app/admin/actions';

interface AdminGrowthTabProps {
  growth?: AdminGrowthData;
}

const MONTH_NAMES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

export function AdminGrowthTab({ growth }: AdminGrowthTabProps) {
  const totalCollectorContacts = growth?.totalCollectorContacts || 0;
  const collectorUsersCount = growth?.collectorUsersCount || 0;
  const totalShares = growth?.totalShares || 0;
  const shares = growth?.sharesByType || {
    whatsapp_chat: 0,
    story_whatsapp: 0,
    story_instagram: 0,
    story_tiktok: 0,
    copy_link: 0,
    download_story: 0,
  };

  const topHosts = growth?.topCollectorHosts || [];
  const recentSubmissions = growth?.recentSubmissions || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-violet-950 via-indigo-950 to-slate-950 text-white border border-violet-800/40 shadow-sm relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-fuchsia-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/25 border border-violet-400/30 text-violet-300 text-[11px] font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Product-Led Growth & Bucle Viral</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Analítica del Recolector de Cumpleaños 🚀
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
              Métricas de captación orgánica a través de páginas públicas <span className="text-violet-300 font-mono">/u/[username]</span>, generador de Stories 9:16 para Instagram, TikTok y Estados de WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-4 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-center">
              <p className="text-[11px] text-slate-300 font-bold uppercase tracking-wider">Tasa de Viralidad</p>
              <p className="text-xl font-black text-emerald-400">
                {collectorUsersCount > 0 ? (totalCollectorContacts / collectorUsersCount).toFixed(1) : '0'}x
              </p>
              <p className="text-[10px] text-slate-400">contactos / anfitrión</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Primary Growth KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Cumpleaños Captados */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Cumpleaños Captados</span>
            <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
              <PartyPopper className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">{totalCollectorContacts}</p>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Por páginas públicas</span>
          </div>
        </div>

        {/* KPI 2: Anfitriones Activos */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Anfitriones Virales</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">{collectorUsersCount}</p>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span>Usuarios con fechas recibidas</span>
          </div>
        </div>

        {/* KPI 3: Difusiones Totales */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Acciones de Difusión</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">{totalShares}</p>
          <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-bold">
            <span>WhatsApp + Stories + Enlaces</span>
          </div>
        </div>

        {/* KPI 4: Stories Creadas */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Stories & Estados</span>
            <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">
            {shares.story_instagram + shares.story_whatsapp + shares.story_tiktok + shares.download_story}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-pink-600 font-bold">
            <span>Instagram, TikTok & WhatsApp</span>
          </div>
        </div>

      </div>

      {/* 3. Channels Breakdown */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Share2 className="w-4 h-4 text-violet-600" />
          <span>Desglose de Tráfico por Canal de Difusión</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          
          {/* WhatsApp Chats */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold">
              <WhatsAppIcon className="w-3.5 h-3.5" size={14} />
              <span>Chats WhatsApp</span>
            </div>
            <p className="text-xl font-black text-emerald-950">{shares.whatsapp_chat}</p>
          </div>

          {/* WhatsApp Estados */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold">
              <WhatsAppIcon className="w-3.5 h-3.5" size={14} />
              <span>WhatsApp Estados</span>
            </div>
            <p className="text-xl font-black text-emerald-950">{shares.story_whatsapp}</p>
          </div>

          {/* Instagram Stories */}
          <div className="p-3.5 rounded-2xl bg-pink-50/60 border border-pink-200/60 space-y-1">
            <div className="flex items-center gap-1.5 text-pink-800 text-xs font-bold">
              <InstagramIcon className="w-3.5 h-3.5" />
              <span>Instagram Stories</span>
            </div>
            <p className="text-xl font-black text-pink-950">{shares.story_instagram}</p>
          </div>

          {/* TikTok Stories */}
          <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-800 text-xs font-bold">
              <TikTokIcon className="w-3.5 h-3.5" />
              <span>TikTok Stories</span>
            </div>
            <p className="text-xl font-black text-slate-950">{shares.story_tiktok}</p>
          </div>

          {/* Copy Link */}
          <div className="p-3.5 rounded-2xl bg-violet-50/60 border border-violet-200/60 space-y-1">
            <div className="flex items-center gap-1.5 text-violet-800 text-xs font-bold">
              <Copy className="w-3.5 h-3.5" />
              <span>Enlaces Copiados</span>
            </div>
            <p className="text-xl font-black text-violet-950">{shares.copy_link}</p>
          </div>

          {/* Download Story HD */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200/60 space-y-1">
            <div className="flex items-center gap-1.5 text-indigo-800 text-xs font-bold">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Stories HD PNG</span>
            </div>
            <p className="text-xl font-black text-indigo-950">{shares.download_story}</p>
          </div>

        </div>
      </div>

      {/* 4. Two Columns: Leaderboard of Viral Hosts + Live Feed of Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Top Viral Hosts (7 cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Top Anfitriones Virales</h3>
                <p className="text-xs text-slate-400">Usuarios con mayor tracción en su recolector</p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-500">{topHosts.length} activos</span>
          </div>

          <div className="p-4 flex-1">
            {topHosts.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {topHosts.map((host, idx) => (
                  <div key={host.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        idx === 0 ? 'bg-amber-400 text-amber-950 shadow-xs' :
                        idx === 1 ? 'bg-slate-300 text-slate-800' :
                        idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {idx + 1}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-slate-900 truncate">{host.displayName}</p>
                          {host.username && (
                            <Link
                              href={`/u/${host.username}`}
                              target="_blank"
                              className="text-[11px] text-violet-600 hover:text-violet-700 font-mono inline-flex items-center gap-0.5 hover:underline shrink-0"
                              title="Ver página pública del anfitrión"
                            >
                              <span>/u/{host.username}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate">{host.email}</p>
                      </div>
                    </div>

                    <div className="px-3 py-1 bg-violet-50 text-violet-700 rounded-full font-black text-xs shrink-0 whitespace-nowrap">
                      {host.count} cumpleaños
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                Aún no hay usuarios con cumpleaños captados.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Feed of Submissions (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Últimos Cumpleaños Captados</h3>
                <p className="text-xs text-slate-400">Registrados en vivo desde enlaces públicos</p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-500">{recentSubmissions.length} recientes</span>
          </div>

          <div className="p-4 flex-1">
            {recentSubmissions.length > 0 ? (
              <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto pr-1">
                {recentSubmissions.map((sub) => {
                  const bdayStr = sub.birthDay && sub.birthMonth 
                    ? `${sub.birthDay} ${MONTH_NAMES[sub.birthMonth - 1]}`
                    : 'Fecha guardada';

                  return (
                    <div key={sub.id} className="py-2.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900 truncate">{sub.contactName}</p>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black shrink-0">
                            🎂 {bdayStr}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate">
                          Para: <span className="font-semibold text-slate-600">{sub.hostName}</span>
                          {sub.hostUsername && <span className="font-mono text-slate-400 ml-1">(@{sub.hostUsername})</span>}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-[11px] text-slate-400 font-mono">{sub.contactPhone ? `+${sub.contactPhone}` : ''}</p>
                        <p className="text-[10px] text-slate-400">{sub.timeStr}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                Aún no se han recibido registros en los enlaces públicos.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
