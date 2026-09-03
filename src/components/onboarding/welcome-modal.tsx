'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Sparkles, Smartphone, CheckCircle2, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import Link from 'next/link';

import { useTranslation } from '@/lib/i18n/context';

interface WelcomeModalProps {
  displayName?: string;
  isWhatsAppConnected?: boolean;
}

export function WelcomeModal({ displayName = 'Bienvenido', isWhatsAppConnected = false }: WelcomeModalProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Show once per device for new users
    const hasSeenWelcome = localStorage.getItem('autobirthday_onboarding_welcome_seen');
    if (!hasSeenWelcome && !isWhatsAppConnected) {
      const timer = setTimeout(() => setIsOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, [isWhatsAppConnected]);

  const handleClose = () => {
    localStorage.setItem('autobirthday_onboarding_welcome_seen', 'true');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden bg-white text-slate-900 border border-slate-200 rounded-3xl shadow-2xl">
        
        {/* HERO BANNER */}
        <div className="p-6 sm:p-8 bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 text-white text-center space-y-3 relative overflow-hidden">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-inner border border-white/20">
            🎂
          </div>
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              {t('onboarding.welcomeTitle').replace('{name}', displayName)}
            </h2>
            <p className="text-xs sm:text-sm text-violet-100 max-w-sm mx-auto font-medium">
              {t('onboarding.welcomeDesc')}
            </p>
          </div>
        </div>

        {/* 3 STEPS CARDS (AIRBNB STYLE) */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="space-y-3">
            
            <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                1
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">{t('onboarding.welcomeStep1Title')}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {t('onboarding.welcomeStep1Desc')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                2
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">{t('onboarding.welcomeStep2Title')}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {t('onboarding.welcomeStep2Desc')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                3
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">{t('onboarding.welcomeStep3Title')}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {t('onboarding.welcomeStep3Desc')}
                </p>
              </div>
            </div>

          </div>

          <div className="pt-2">
            <Link
              href="/whatsapp"
              onClick={handleClose}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-violet-500/25 transition-all"
            >
              <span>{t('onboarding.getStarted')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
