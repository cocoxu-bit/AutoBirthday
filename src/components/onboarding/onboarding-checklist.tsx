'use client';

import { useState, useEffect } from 'react';
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
import { useTranslation } from '@/lib/i18n/context';

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
  const { t } = useTranslation();
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<'whatsapp' | 'contacts' | 'assistant'>('whatsapp');
  const [isDismissed, setIsDismissed] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem('autobirthday_onboarding_dismissed') === 'true') {
        setIsDismissed(true);
      }
    } catch {}
  }, []);

  // Calculate Progress
  const step1 = isWhatsAppConnected;
  const step2 = contactsCount > 0;
  const step3 = hasReceivedWelcome || isWhatsAppConnected;

  const completedSteps = [step1, step2, step3].filter(Boolean).length;
  const percentage = Math.round((completedSteps / 3) * 100);
  const allCompleted = completedSteps === 3;

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem('autobirthday_onboarding_dismissed', 'true');
    } catch {}
  };

  // Automatically disappear when all 3 steps are completed or user dismissed it
  if (isDismissed || allCompleted) {
    return null;
  }

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
              <span>{t('onboarding.activationGuide')}</span>
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                {t('onboarding.activationGuideDesc')}
              </h3>
            </div>
            
            <p className="text-xs text-slate-300 max-w-xl font-medium">
              {t('onboarding.activationSubtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setDefaultTab('whatsapp');
                setVideoModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors border border-white/10"
              title={t('onboarding.watchVideo')}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="hidden md:inline">{t('onboarding.watchVideo')}</span>
            </button>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title={isCollapsed ? "Expandir" : "Plegar"}
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>

            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-red-400 transition-colors"
              title="Ocultar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="mt-4 pt-3 border-t border-white/10 relative z-10 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-300">{t('onboarding.accountProgress')}</span>
            <span className={allCompleted ? 'text-emerald-400' : 'text-violet-300'}>
              {t('onboarding.stepOf').replace('{completed}', completedSteps.toString()).replace('{total}', '3').replace('{percent}', percentage.toString())}
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
                  <span className="text-xs font-bold text-white">{t('onboarding.step1Title')}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                {step1 ? t('onboarding.step1DescDone') : t('onboarding.step1DescPending')}
              </p>
              {!step1 && (
                <Link
                  href="/whatsapp"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300"
                >
                  <span>{t('onboarding.step1Cta')}</span>
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
                  <span className="text-xs font-bold text-white">{t('onboarding.step2Title')}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                {step2 ? t('onboarding.step2DescDone').replace('{count}', contactsCount.toString()) : t('onboarding.step2DescPending')}
              </p>
              {!step2 && (
                <Link
                  href="/contacts/new"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-violet-300 hover:text-white"
                >
                  <span>{t('onboarding.step2Cta')}</span>
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
                  <span className="text-xs font-bold text-white">{t('onboarding.step3Title')}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                {t('onboarding.step3Desc')}
              </p>
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
