'use client';

import React, { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Copy, 
  Check, 
  CheckCheck, 
  RefreshCw, 
  Heart, 
  Smile, 
  Briefcase, 
  Users, 
  User,
  ArrowRight,
  ShieldCheck,
  Send,
  MessageSquare
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/whatsapp-icon';
import { generatePublicWishAction } from '@/app/felicitaciones/actions';
import { recordPageConversionAction } from '@/lib/analytics/traffic-actions';
import { toast } from 'sonner';

export type WishRelationship = 'amigo/a' | 'pareja' | 'familiar' | 'compañero/a' | 'jefe/a';
export type WishTone = 'divertido' | 'casual' | 'emotivo' | 'formal';

interface BirthdayWishGeneratorProps {
  defaultRelationship?: WishRelationship;
  defaultTone?: WishTone;
  defaultName?: string;
  badgeText?: string;
}

const RELATIONSHIPS: Array<{ id: WishRelationship; label: string; icon: React.ReactNode }> = [
  { id: 'amigo/a', label: 'Amigo/a', icon: <Users className="w-3.5 h-3.5" /> },
  { id: 'pareja', label: 'Pareja', icon: <Heart className="w-3.5 h-3.5 text-rose-500" /> },
  { id: 'familiar', label: 'Familiar', icon: <User className="w-3.5 h-3.5 text-amber-500" /> },
  { id: 'compañero/a', label: 'Compañero/a', icon: <Briefcase className="w-3.5 h-3.5 text-indigo-500" /> },
  { id: 'jefe/a', label: 'Jefe/a', icon: <Briefcase className="w-3.5 h-3.5 text-slate-700" /> },
];

const TONES: Array<{ id: WishTone; label: string; emoji: string; desc: string }> = [
  { id: 'divertido', label: 'Divertido', emoji: '🍻', desc: 'Humor y bromas con chispa' },
  { id: 'casual', label: 'Casual', emoji: '👋', desc: 'Cercano, amigable y natural' },
  { id: 'emotivo', label: 'Emotivo', emoji: '❤️', desc: 'Sincero, cariñoso y de corazón' },
  { id: 'formal', label: 'Formal', emoji: '👔', desc: 'Elegante, respetuoso y profesional' },
];

export function BirthdayWishGenerator({
  defaultRelationship = 'amigo/a',
  defaultTone = 'divertido',
  defaultName = '',
  badgeText,
}: BirthdayWishGeneratorProps) {
  const [name, setName] = useState(defaultName);
  const [relationship, setRelationship] = useState<WishRelationship>(defaultRelationship);
  const [tone, setTone] = useState<WishTone>(defaultTone);
  const [notes, setNotes] = useState('');
  const [honeypot, setHoneypot] = useState('');

  const [generatedWish, setGeneratedWish] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState('11:00');
  const [isPending, startTransition] = useTransition();

  // Keep local time updated for simulated WhatsApp bubble
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setCurrentTimeStr(`${hours}:${mins}`);
    };
    updateTime();
  }, []);

  const handleGenerate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!name.trim() || name.trim().length < 2) {
      toast.error('Por favor, escribe el nombre del cumpleañero/a');
      return;
    }

    startTransition(async () => {
      setCopied(false);
      const res = await generatePublicWishAction({
        name: name.trim(),
        relationship,
        tone,
        notes: notes.trim() || undefined,
        honeypot,
      });

      if (res.success && res.wish) {
        setGeneratedWish(res.wish);
        toast.success('¡Felicitación generada con éxito! ✨');
        if (typeof window !== 'undefined') {
          recordPageConversionAction(window.location.pathname, 'wish_generated').catch(() => {});
        }
      } else {
        toast.error(res.error || 'Error al generar felicitación');
      }
    });
  };

  const handleCopy = async () => {
    if (!generatedWish) return;
    try {
      await navigator.clipboard.writeText(generatedWish);
      setCopied(true);
      if (typeof window !== 'undefined') {
        recordPageConversionAction(window.location.pathname, 'wish_copied').catch(() => {});
      }
      toast.success('¡Copiado al portapapeles! Listo para pegar en WhatsApp 🎉', {
        duration: 3500,
      });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('No se pudo copiar automáticamente. Por favor selecciónalo manualmente.');
    }
  };

  // Pre-save pending contact to sessionStorage on click of CTA
  const handleCtaClick = () => {
    try {
      const pendingData = {
        name: name.trim() || 'Cumpleañero',
        relationship,
        tone,
        source: 'wish_generator',
      };
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('autobirthday_pending_contact', JSON.stringify(pendingData));
      }
    } catch {}
  };

  const registerHref = `/register?name=${encodeURIComponent(name.trim() || '')}&relationship=${encodeURIComponent(relationship)}&tone=${encodeURIComponent(tone)}&ref=generador_ia`;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      
      {/* 1. Main Generator Card */}
      <div className="bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-900/5 transition-all">
        
        {/* Header Tag */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100/90 text-violet-800 text-xs font-bold tracking-wide border border-violet-200">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span>{badgeText || 'Generador con IA Gratis'}</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Sin registro previo
          </span>
        </div>

        <form onSubmit={handleGenerate} className="space-y-5">
          {/* Honeypot anti-bot */}
          <input
            type="text"
            name="website_url"
            value={honeypot}
            onChange={e => setHoneypot(e.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
          />

          {/* Campo 1: Nombre */}
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
              ¿A quién felicitas? <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="ej. Carlos, Mamá, Laura, Juan..."
              maxLength={40}
              className="w-full h-12 px-4 bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 text-sm font-semibold placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all shadow-2xs"
            />
          </div>

          {/* Campo 2: Relación */}
          <div className="space-y-2 text-left">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
              Vínculo o relación
            </label>
            <div className="flex flex-wrap gap-2">
              {RELATIONSHIPS.map(rel => {
                const isSelected = relationship === rel.id;
                return (
                  <button
                    key={rel.id}
                    type="button"
                    onClick={() => setRelationship(rel.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900 ring-offset-1'
                        : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                    }`}
                  >
                    {rel.icon}
                    <span>{rel.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Campo 3: Tono */}
          <div className="space-y-2 text-left">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
              Tono de la felicitación
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TONES.map(t => {
                const isSelected = tone === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id)}
                    className={`p-3 rounded-2xl text-left border transition-all ${
                      isSelected
                        ? 'bg-violet-50/90 border-violet-500 ring-2 ring-violet-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xl mb-1">{t.emoji}</div>
                    <p className={`text-xs font-bold ${isSelected ? 'text-violet-950' : 'text-slate-800'}`}>
                      {t.label}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium leading-tight truncate">
                      {t.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Campo 4: Detalle Opcional */}
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
              Anécdota, afición o apodo <span className="text-[10px] font-normal text-slate-400 lowercase">(opcional para bordarlo)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="ej. Le encanta el pádel, cumple 30, siempre llega tarde, fan del Real Madrid..."
              maxLength={120}
              className="w-full h-11 px-4 bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 text-xs font-medium placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all shadow-2xs"
            />
          </div>

          {/* Botón Principal */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full h-13 mt-2 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 hover:from-violet-700 hover:to-indigo-700 text-white font-black text-sm tracking-wide shadow-lg shadow-violet-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Redactando con Inteligencia Artificial...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Generar Felicitación con IA ✨</span>
              </>
            )}
          </button>
        </form>

      </div>

      {/* 2. WhatsApp Bubble Result Section (Shown when generated) */}
      {generatedWish && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
          
          <div className="p-4 sm:p-6 bg-slate-900/5 rounded-3xl border border-slate-200">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <WhatsAppIcon className="w-4 h-4 text-emerald-600" />
                <span>Vista Previa en WhatsApp</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Listo para enviar
              </span>
            </div>

            {/* Simulated WhatsApp Wallpaper and Message Bubble */}
            <div className="p-4 sm:p-6 rounded-2xl bg-[#efeae2] bg-opacity-90 relative overflow-hidden border border-slate-300/60 shadow-inner">
              <div className="max-w-md ml-auto">
                
                {/* Green WhatsApp Speech Bubble */}
                <div className="bg-[#d9fdd3] text-slate-900 p-3.5 sm:p-4 rounded-2xl rounded-tr-xs shadow-sm space-y-2 relative border border-emerald-200/60 text-left">
                  <p className="text-sm sm:text-base leading-relaxed font-normal whitespace-pre-wrap select-all text-slate-800">
                    {generatedWish}
                  </p>
                  
                  {/* Bubble timestamp & double blue checkmark */}
                  <div className="flex items-center justify-end gap-1 text-[11px] text-slate-500 pt-1 font-sans">
                    <span>{currentTimeStr}</span>
                    <CheckCheck className="w-4 h-4 text-[#53bdeb]" />
                  </div>
                </div>

              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <button
                type="button"
                onClick={handleCopy}
                className={`w-full h-12 rounded-2xl font-bold text-xs sm:text-sm tracking-wide transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20 active:scale-[0.99]'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>¡Copiado al portapapeles! 🎉</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar para WhatsApp</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleGenerate()}
                disabled={isPending}
                className="w-full h-12 rounded-2xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs sm:text-sm tracking-wide transition-all flex items-center justify-center gap-2 shadow-2xs active:scale-[0.99] cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isPending ? 'animate-spin' : ''}`} />
                <span>Regenerar otra versión</span>
              </button>
            </div>
          </div>

          {/* 3. The Viral Conversion Hook (High-Contrast Bridge to AutoBirthday) */}
          <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 text-white border border-violet-800/40 shadow-xl shadow-violet-950/20 text-left relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-black uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>100% Gratis · Nunca más olvidarás una fecha</span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg sm:text-xl font-black text-white leading-snug">
                  ¿Te da miedo que se te vuelva a pasar la fecha el año que viene?
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                  <strong className="text-white font-bold">AutoBirthday</strong> se conecta de forma segura a tu WhatsApp y envía felicitaciones personalizadas con IA como esta a la hora perfecta, de forma <span className="text-emerald-400 font-bold">100% automática</span> sin que tengas que acordarte.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href={registerHref}
                  onClick={handleCtaClick}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all"
                >
                  <span>Automatizar mis felicitaciones gratis</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <p className="text-[11px] text-slate-400 flex items-center gap-2">
                <span>⚡ Sin tarjeta de crédito</span>
                <span>·</span>
                <span>Configuración en 60 segundos</span>
              </p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
