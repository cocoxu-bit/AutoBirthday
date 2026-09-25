'use client';

import React, { useState, useMemo } from 'react';
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
  Copy,
  Globe,
  Search,
  ArrowUpRight,
  BarChart3,
  Layers,
  ShieldCheck,
  Check
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/whatsapp-icon';
import { InstagramIcon, TikTokIcon } from '@/components/ui/social-icons';
import { AdminGrowthData, ActiveUrlTrafficItem } from '@/app/admin/actions';

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
  const totalGlobalBirthdays = growth?.totalGlobalBirthdays || 0;
  const verifiedGlobalBirthdays = growth?.verifiedGlobalBirthdays || 0;
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

  const [filterCategory, setFilterCategory] = useState<'all' | 'core_hub' | 'seo_programmatic' | 'viral_collector'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const activeUrls = growth?.activeUrls || [];
  const trafficSummary = growth?.trafficSummary || {
    totalActiveUrls: activeUrls.length,
    totalViews: 0,
    totalConversions: 0,
    avgConversionRate: 0,
    seoViews: 0,
    viralViews: 0,
  };

  const filteredUrls = useMemo(() => {
    return activeUrls.filter((item) => {
      // Category filter
      if (filterCategory === 'core_hub') {
        if (item.category !== 'core' && item.category !== 'seo_hub') return false;
      } else if (filterCategory === 'seo_programmatic') {
        if (item.category !== 'seo_programmatic') return false;
      } else if (filterCategory === 'viral_collector') {
        if (item.category !== 'viral_collector') return false;
      }

      // Search term filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        return (
          item.path.toLowerCase().includes(query) ||
          item.title.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [activeUrls, filterCategory, searchTerm]);

  const copyUrlToClipboard = (path: string) => {
    const fullUrl = `https://autobirthday.com${path}`;
    navigator.clipboard.writeText(fullUrl).catch(() => {});
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

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
              Analítica del Recolector y Red Global 🚀
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
              Métricas de captación orgánica a través de páginas públicas <span className="text-violet-300 font-mono">/u/[username]</span>, generador de Stories 9:16 y el <span className="text-emerald-300 font-medium">Directorio Global de Cumpleaños</span> compartido entre cuentas.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/tools/fake-chat"
              className="inline-flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-xs rounded-2xl shadow-lg shadow-purple-500/30 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>Fake Chat Studio 🎭</span>
            </Link>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* KPI 1: Directorio Global */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Directorio Global</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">{totalGlobalBirthdays}</p>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold truncate">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{verifiedGlobalBirthdays} verificados por titular</span>
          </div>
        </div>

        {/* KPI 2: Cumpleaños Captados */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Captados por Enlace</span>
            <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
              <PartyPopper className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">{totalCollectorContacts}</p>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold truncate">
            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
            <span>Páginas públicas /u/</span>
          </div>
        </div>

        {/* KPI 3: Anfitriones Activos */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Anfitriones Virales</span>
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">{collectorUsersCount}</p>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium truncate">
            <span>Usuarios con fechas recibidas</span>
          </div>
        </div>

        {/* KPI 4: Difusiones Totales */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Acciones Difusión</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">{totalShares}</p>
          <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-bold truncate">
            <span>WhatsApp + Stories + Enlaces</span>
          </div>
        </div>

        {/* KPI 5: Stories Creadas */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Stories Creadas</span>
            <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">
            {shares.story_instagram + shares.story_whatsapp + shares.story_tiktok + shares.download_story}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-pink-600 font-bold truncate">
            <span>Instagram, TikTok & WA</span>
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

      {/* 5. Catálogo de URLs Activas & Tráfico en Tiempo Real */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-6 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 border border-violet-200 text-violet-800 text-[11px] font-black uppercase tracking-wider mb-2">
              <Globe className="w-3.5 h-3.5 text-violet-600" />
              <span>SEO Programático, Hubs & Red Viral</span>
            </div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              Catálogo de URLs Activas & Tráfico en Vivo 🌐
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Monitorización de páginas indexadas en Google, herramientas públicas gratuitas y recolectores virales con visitas y conversiones en tiempo real.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
              {activeUrls.length} URLs Monitoreadas
            </span>
          </div>
        </div>

        {/* Traffic KPI Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">URLs Activas</p>
            <p className="text-xl font-black text-slate-900">{trafficSummary.totalActiveUrls}</p>
            <p className="text-[10px] text-slate-500 font-medium">100% operativas</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-violet-50/60 border border-violet-200/60 space-y-1">
            <p className="text-[10px] font-bold text-violet-700 uppercase tracking-wider">Visitas Totales</p>
            <p className="text-xl font-black text-violet-950">{trafficSummary.totalViews}</p>
            <p className="text-[10px] text-violet-600 font-medium">En todas las rutas</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 space-y-1">
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Conversiones</p>
            <p className="text-xl font-black text-emerald-950">{trafficSummary.totalConversions}</p>
            <p className="text-[10px] text-emerald-600 font-medium">Deseos + Fechas + CTA</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/60 space-y-1">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Ratio Conversión</p>
            <p className="text-xl font-black text-amber-950">{trafficSummary.avgConversionRate}%</p>
            <p className="text-[10px] text-amber-700 font-medium">Media global de éxito</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-200/60 space-y-1">
            <p className="text-[10px] font-bold text-sky-700 uppercase tracking-wider">Tráfico SEO</p>
            <p className="text-xl font-black text-sky-950">{trafficSummary.seoViews}</p>
            <p className="text-[10px] text-sky-600 font-medium">Hub + 10 slugs IA</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-fuchsia-50/60 border border-fuchsia-200/60 space-y-1">
            <p className="text-[10px] font-bold text-fuchsia-700 uppercase tracking-wider">Tráfico Viral</p>
            <p className="text-xl font-black text-fuchsia-950">{trafficSummary.viralViews}</p>
            <p className="text-[10px] text-fuchsia-600 font-medium">Páginas /u/ compartidas</p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl overflow-x-auto text-xs font-bold text-slate-600 shrink-0">
            <button
              type="button"
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterCategory === 'all' 
                  ? 'bg-white text-slate-900 shadow-xs font-black' 
                  : 'hover:text-slate-900'
              }`}
            >
              Todas ({activeUrls.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('seo_programmatic')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterCategory === 'seo_programmatic' 
                  ? 'bg-white text-violet-700 shadow-xs font-black' 
                  : 'hover:text-slate-900'
              }`}
            >
              SEO Programático (10)
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('core_hub')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterCategory === 'core_hub' 
                  ? 'bg-white text-slate-900 shadow-xs font-black' 
                  : 'hover:text-slate-900'
              }`}
            >
              Hub & Landing
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('viral_collector')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterCategory === 'viral_collector' 
                  ? 'bg-white text-emerald-700 shadow-xs font-black' 
                  : 'hover:text-slate-900'
              }`}
            >
              Recolectores (/u/)
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por URL o título..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-slate-400 font-medium"
            />
          </div>
        </div>

        {/* URLs Table */}
        <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Ruta URL & Título</th>
                  <th className="py-3 px-3">Categoría</th>
                  <th className="py-3 px-3 text-right">Visitas</th>
                  <th className="py-3 px-3 text-right">Conversiones</th>
                  <th className="py-3 px-3 text-right">Ratio CR</th>
                  <th className="py-3 px-3">Indexación & Marcado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredUrls.length > 0 ? (
                  filteredUrls.map((item) => {
                    const badgeCategory = 
                      item.category === 'seo_programmatic' ? { label: 'SEO IA', bg: 'bg-violet-100 text-violet-800 border-violet-200' } :
                      item.category === 'seo_hub' ? { label: 'Hub Principal', bg: 'bg-purple-100 text-purple-800 border-purple-200' } :
                      item.category === 'viral_collector' ? { label: 'Recolector /u/', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' } :
                      { label: 'Core App', bg: 'bg-slate-100 text-slate-700 border-slate-200' };

                    return (
                      <tr key={item.path} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 min-w-[220px]">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 hover:text-violet-600 transition-colors">
                              {item.path}
                            </span>
                            <Link
                              href={item.path}
                              target="_blank"
                              className="text-slate-400 hover:text-violet-600 transition-colors p-0.5 rounded"
                              title="Abrir en nueva pestaña"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate max-w-sm mt-0.5">
                            {item.title}
                          </p>
                        </td>

                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-wider ${badgeCategory.bg}`}>
                            {badgeCategory.label}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1 font-black text-slate-900">
                            <Eye className="w-3 h-3 text-slate-400" />
                            <span>{item.views}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-right whitespace-nowrap">
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                            {item.conversions}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-right whitespace-nowrap font-bold">
                          <span className={item.conversionRate > 0 ? 'text-amber-700' : 'text-slate-400'}>
                            {item.conversionRate}%
                          </span>
                        </td>

                        <td className="py-3.5 px-3 whitespace-nowrap">
                          {item.isIndexable ? (
                            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Indexable (Schema.org)</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                              <span>Privado (noindex)</span>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => copyUrlToClipboard(item.path)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-violet-700 bg-slate-100 hover:bg-violet-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                            title="Copiar URL completa"
                          >
                            {copiedPath === item.path ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-600 font-bold">Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copiar</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400 text-xs font-medium">
                      No se encontraron URLs activas con los filtros actuales.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
