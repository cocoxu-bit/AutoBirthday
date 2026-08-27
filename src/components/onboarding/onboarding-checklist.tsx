'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, 
  Circle, 
  Smartphone, 
  UserPlus, 
  Bot, 
  Sparkles, 
  Play, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  X,
  ExternalLink,
  PartyPopper
} from 'lucide-react';
import { VideoGuideModal } from './video-guide-modal';

interface OnboardingChecklistProps {
  isWhatsAppConnected: boolean;
  contactsCount: number;
  hasReceivedWelcome?: boolean;
}

export function OnboardingChecklist({
  isWhatsAppConnected,
  contactsCount,
  hasReceivedWelcome = false,
}: OnboardingChecklistProps) {
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<'whatsapp' | 'contacts' | 'assistant'>('whatsapp');
  const [isDismissed, setIsDismissed] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Calculate Progress
  const step1 = isWhatsAppConnected;
  const step2 = contactsCount > 0;
  const step3 = hasReceivedWelcome || isWhatsAppConnected;

  const completedSteps = [step1, step2, step3].filter(Boolean).length;
  const percentage = Math.round((completedSteps / 3) * 100);
  const allCompleted = completedSteps === 3;

  if (isDismissed) return null;

  const openGuideFor = (tab: 'whatsapp' | 'contacts' | 'assistant') => {
    setDefaultTab(tab);
    setVideoModalOpen(true);
  };

  return (
    <>
      <div className="bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-5 sm:p-6 border border-violet-500/30 shadow-xl relative overflow-hidden transition-all duration-300">
        
        {/* Background decorative glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* HEADER SECTION */}
        <div className="flex items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[11px] font-bold border border-violet-500/30">
              <Sparkles className="w-3 h-3 text-violet-300" />
              <span>Guía de Activación Rápida</span>
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                {allCompleted ? '¡Tu cuenta está 100% lista! 🎉' : 'Primeros pasos para automatizar tus cumpleaños'}
              </h3>
            </div>
            
            <p className="text-xs text-slate-300 max-w-xl font-medium">
              {allCompleted 
                ? 'Has completado la configuración básica. AutoBirthday se encargará del resto.'
                : 'Completa estos 3 sencillos pasos para que tus felicitaciones salgan solas.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setDefaultTab('whatsapp');
                setVideoModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors border border-white/10"
              title="Ver guías y vídeos explicativos"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="hidden md:inline">Ver Guía en Vídeo</span>
            </button>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title={isCollapsed ? "Expandir" : "Plegar"}
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="mt-4 pt-3 border-t border-white/10 relative z-10 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-300">Progreso de tu cuenta:</span>
            <span className={allCompleted ? 'text-emerald-400' : 'text-violet-300'}>
              {completedSteps} de 3 pasos ({percentage}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-800/80 rounded-full overflow-hidden border border-white/10 p-0.5">
            <div 
              className="h-full bg-gradient-to-r from-violet-500 via-indigo-400 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(8, percentage)}%` }}
            />
          </div>
        </div>

        {/* 3 STEPS GRID */}
        {!isCollapsed && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 relative z-10">
            
            {/* STEP 1: VINCULAR WHATSAPP */}
            <div className={`p-4 rounded-2xl border transition-all ${
              step1 
                ? 'bg-emerald-950/40 border-emerald-500/30' 
                : 'bg-white/5 border-white/10 hover:border-violet-500/40'
            }`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {step1 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                  <span className="text-xs font-bold text-white">1. Vincular WhatsApp</span>
                </div>
                <button 
                  onClick={() => openGuideFor('whatsapp')}
                  className="text-[10px] text-violet-300 hover:text-white underline"
                >
                  Ver vídeo
                </button>
              </div>
              <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                {step1 ? 'WhatsApp conectado correctamente.' : 'Conéctalo con QR o código de 8 dígitos.'}
              </p>
              {!step1 && (
                <Link
                  href="/whatsapp"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300"
                >
                  <span>Vincular ahora</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            {/* STEP 2: CREAR PRIMER CONTACTO */}
            <div className={`p-4 rounded-2xl border transition-all ${
              step2 
                ? 'bg-emerald-950/40 border-emerald-500/30' 
                : 'bg-white/5 border-white/10 hover:border-violet-500/40'
            }`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {step2 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                  <span className="text-xs font-bold text-white">2. Añadir Cumpleañeros</span>
                </div>
                <button 
                  onClick={() => openGuideFor('contacts')}
                  className="text-[10px] text-violet-300 hover:text-white underline"
                >
                  Ver vídeo
                </button>
              </div>
              <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                {step2 ? `¡Genial! Tienes ${contactsCount} contacto(s) activo(s).` : 'Añade a tu madre, pareja o mejores amigos.'}
              </p>
              {!step2 && (
                <Link
                  href="/contacts/new"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-violet-300 hover:text-white"
                >
                  <span>Añadir contacto</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            {/* STEP 3: CONOCER AL ASISTENTE */}
            <div className={`p-4 rounded-2xl border transition-all ${
              step3 
                ? 'bg-emerald-950/40 border-emerald-500/30' 
                : 'bg-white/5 border-white/10 hover:border-violet-500/40'
            }`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {step3 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                  <span className="text-xs font-bold text-white">3. Guardar Asistente</span>
                </div>
                <button 
                  onClick={() => openGuideFor('assistant')}
                  className="text-[10px] text-violet-300 hover:text-white underline"
                >
                  Ver vídeo
                </button>
              </div>
              <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                Guarda el <strong>+34 926 31 24 36</strong> para aprobar con un simple "SÍ".
              </p>
              <a
                href="https://wa.me/34926312436?text=Hola%20AutoBirthday"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300"
              >
                <span>Abrir chat del Asistente</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

          </div>
        )}

      </div>

      {/* VIDEO / MICRO-GUIDE MODAL */}
      <VideoGuideModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        defaultTab={defaultTab}
      />
    </>
  );
}
