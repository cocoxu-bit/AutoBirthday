'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { 
  Smartphone, 
  QrCode, 
  CheckCircle2, 
  Loader2, 
  Copy, 
  Check, 
  ArrowRight, 
  Sparkles, 
  Play, 
  Calendar, 
  Users, 
  CheckCheck,
  Volume2,
  VolumeX,
  ChevronRight,
  ShieldCheck,
  Zap,
  PartyPopper
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/whatsapp-icon';
import { WhatsAppSyncDialog } from '@/components/contacts/whatsapp-sync-dialog';
import { CalendarSyncDialog } from '@/components/contacts/calendar-sync-dialog';
import { 
  getConnectionStatus, 
  connectWithPairingCode, 
  connectInstance, 
  refreshQRCode 
} from '@/app/(dashboard)/whatsapp/actions';
import { completeOnboardingAction } from '@/app/onboarding/actions';
import { WhatsAppVideoDrawer } from '@/components/whatsapp/whatsapp-video-drawer';
import { useTranslation } from '@/lib/i18n/context';
import { WhatsAppInstanceStatus } from '@/types';

interface OnboardingWizardProps {
  initialIsConnected?: boolean;
  initialContactsCount?: number;
  displayName?: string;
  forcedStep?: 1 | 2 | 3;
}

export function OnboardingWizard({
  initialIsConnected = false,
  initialContactsCount = 0,
  displayName = '',
  forcedStep,
}: OnboardingWizardProps) {
  const router = useRouter();
  const { t, locale, setLocale } = useTranslation();
  
  // Step: 1 = Connect WA, 2 = Import Birthdays, 3 = Completed Celebration
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(forcedStep || 1);
  
  // WhatsApp connection state
  const [waStatus, setWaStatus] = useState<WhatsAppInstanceStatus>(initialIsConnected ? 'connected' : 'disconnected');
  const [connectMethod, setConnectMethod] = useState<'code' | 'qr'>('code');
  const [phoneInput, setPhoneInput] = useState('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);
  
  // Modals for Step 2 & Video Drawer
  const [isVideoDrawerOpen, setIsVideoDrawerOpen] = useState(false);
  const [isWhatsAppSyncOpen, setIsWhatsAppSyncOpen] = useState(false);
  const [isCalendarSyncOpen, setIsCalendarSyncOpen] = useState(false);
  const [importedCount, setImportedCount] = useState(initialContactsCount);

  // Poll connection status while in step 1
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    async function checkStatus() {
      try {
        const res = await getConnectionStatus();
        if (res.status === 'connected') {
          setWaStatus('connected');
          if (currentStep === 1 && !isAutoAdvancing) {
            setIsAutoAdvancing(true);
            toast.success(t('whatsapp.connectedSuccess'));
            setTimeout(() => {
              setCurrentStep(2);
              setIsAutoAdvancing(false);
            }, 1200);
          }
        } else {
          setWaStatus(res.status);
        }
      } catch {
        // silent background check
      }
    }

    if (currentStep === 1 && waStatus !== 'connected') {
      interval = setInterval(checkStatus, 2500);
    }

    return () => clearInterval(interval);
  }, [currentStep, waStatus, isAutoAdvancing, t]);

  // Handle Pairing Code Generation
  const handleGetPairingCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phoneInput || phoneInput.trim().length < 7) {
      toast.error(t('whatsapp.phoneInputPlaceholder'));
      return;
    }

    setLoadingAction(true);
    setPairingCode(null);
    try {
      const res = await connectWithPairingCode(phoneInput.trim());
      if (res.success && res.pairingCode) {
        setPairingCode(res.pairingCode);
        setWaStatus('connecting');
        toast.success(t('whatsapp.copyCode'));
      } else {
        toast.error(res.error || 'Error al generar el código');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error de conexión');
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle QR Generation
  const handleGetQR = async () => {
    setLoadingAction(true);
    setQrCode(null);
    try {
      const res = await connectInstance();
      if (res.success && res.qr) {
        setQrCode(res.qr);
        setWaStatus('connecting');
      } else {
        toast.error('Error al generar código QR');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al generar QR');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCopyCode = () => {
    if (!pairingCode) return;
    navigator.clipboard.writeText(pairingCode);
    setCopied(true);
    toast.success(t('whatsapp.copied'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFinishOnboarding = async () => {
    try {
      await completeOnboardingAction();
    } catch {
      // non-blocking
    }
    router.push('/dashboard');
  };

  const handleSkip = async () => {
    try {
      await completeOnboardingAction();
    } catch {
      // non-blocking
    }
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-violet-600 selection:text-white">
      
      {/* ─── TOP NAVIGATION BAR ─────────────────────────────────────── */}
      <header className="px-4 sm:px-8 py-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <Image 
            src="/logo.png" 
            alt="AutoBirthday" 
            width={32} 
            height={32} 
            className="rounded-xl shadow-md shadow-violet-600/30" 
            priority 
          />
          <span className="text-base sm:text-lg font-black tracking-tight text-white">
            AutoBirthday
          </span>
        </div>

        {/* Step Indicator Badges (Clickable to switch between steps) */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-bold bg-slate-900 border border-slate-800 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              currentStep === 1 
                ? 'bg-violet-600 text-white shadow-sm font-black' 
                : waStatus === 'connected' 
                ? 'text-emerald-400 hover:text-emerald-300' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t('onboarding.wizardStep1')}
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              currentStep === 2 
                ? 'bg-violet-600 text-white shadow-sm font-black' 
                : currentStep === 3 
                ? 'text-emerald-400 hover:text-emerald-300' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t('onboarding.wizardStep2')}
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              currentStep === 3 
                ? 'bg-emerald-600 text-white shadow-sm font-black' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t('onboarding.wizardStep3')}
          </button>
        </div>

        {/* Skip action button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSkip}
            className="text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors px-3 py-1.5 rounded-xl hover:bg-white/5"
          >
            {t('onboarding.skipForNow')} &rarr;
          </button>
        </div>
      </header>

      {/* ─── MAIN CONTENT CONTAINER ─────────────────────────────────── */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col justify-center">

        {/* ============================================================= */}
        {/* STEP 1: CONECTAR WHATSAPP (VÍDEO 9:16 + PAIRING / QR)        */}
        {/* ============================================================= */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                <Zap className="w-3.5 h-3.5" />
                <span>{t('onboarding.welcomeStep1Title')}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {t('onboarding.step1TitleMain')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {t('onboarding.step1SubtitleMain')}
              </p>
            </div>

            <div className="max-w-xl mx-auto w-full space-y-4">
              
              {/* VIDEO TUTORIAL TRIGGER BANNER (BOTTOM SHEET DRAWER) */}
              <button
                type="button"
                onClick={() => setIsVideoDrawerOpen(true)}
                className="w-full p-4 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-violet-500/15 hover:from-emerald-500/25 hover:to-violet-500/25 border border-emerald-500/30 hover:border-emerald-500/50 rounded-3xl transition-all flex items-center justify-between group shadow-xl text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-sm group-hover:scale-110 transition-transform shadow-inner shrink-0">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-black text-white group-hover:text-emerald-300 transition-colors">
                        {t('onboarding.videoHelpTitle')}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
                        15s
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Ver cómo se hace en el móvil paso a paso (se abre desde abajo)
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 shrink-0">
                  <span className="hidden sm:inline">Ver vídeo</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              </button>

              {/* INTERACTIVE CONNECTION CARD */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5 backdrop-blur-md">
                
                {/* Method selector tabs */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800/80 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setConnectMethod('code');
                    }}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all ${
                      connectMethod === 'code'
                        ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>{t('whatsapp.tabCode')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConnectMethod('qr');
                      if (!qrCode) handleGetQR();
                    }}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all ${
                      connectMethod === 'qr'
                        ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>{t('whatsapp.tabQr')}</span>
                  </button>
                </div>

                {/* TAB CONTENT: PAIRING CODE */}
                {connectMethod === 'code' && (
                  <div className="space-y-4">
                    <form onSubmit={handleGetPairingCode} className="space-y-3">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        {t('whatsapp.phoneInputLabel')}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value)}
                          placeholder={t('whatsapp.phoneInputPlaceholder')}
                          className="flex-1 px-4 py-3 bg-slate-950 border border-slate-700/80 rounded-2xl text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                          autoFocus
                        />
                        <button
                          type="submit"
                          disabled={loadingAction || !phoneInput.trim()}
                          className="px-5 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold rounded-2xl transition-all shadow-md shadow-violet-600/25 disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
                        >
                          {loadingAction ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <span>{t('whatsapp.getCodeButton')}</span>
                          )}
                        </button>
                      </div>
                    </form>

                    {/* CODE BOX DISPLAY */}
                    {pairingCode && (
                      <div className="p-4 bg-slate-950/90 border border-emerald-500/30 rounded-2xl space-y-3 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="font-bold text-emerald-400">Tu código de 8 dígitos:</span>
                          <span className="text-[11px]">Expira en 2 minutos</span>
                        </div>

                        <div className="flex items-center justify-between gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800">
                          <span className="text-2xl sm:text-3xl font-mono font-black tracking-widest text-white select-all">
                            {pairingCode.length === 8 
                              ? `${pairingCode.slice(0, 4)} - ${pairingCode.slice(4)}` 
                              : pairingCode}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyCode}
                            className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 text-xs font-bold"
                            title="Copiar código"
                          >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            <span>{copied ? t('whatsapp.copied') : t('whatsapp.copyCode')}</span>
                          </button>
                        </div>

                        <ol className="text-xs text-slate-300 space-y-1.5 pl-1">
                          <li>1. Abre <strong>WhatsApp</strong> en tu teléfono.</li>
                          <li>2. Ve a <strong>Ajustes</strong> &gt; <strong>Dispositivos vinculados</strong>.</li>
                          <li>3. Toca en <strong>Vincular un dispositivo</strong> y luego <strong>Vincular con el número de teléfono</strong>.</li>
                          <li>4. Escribe el código de arriba. ¡Se conectará en 3 segundos!</li>
                        </ol>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB CONTENT: QR CODE */}
                {connectMethod === 'qr' && (
                  <div className="space-y-4 text-center py-2">
                    {loadingAction ? (
                      <div className="py-12 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                        <p className="text-xs text-slate-400">Generando código QR seguro...</p>
                      </div>
                    ) : qrCode ? (
                      <div className="space-y-3">
                        <div className="inline-block p-4 bg-white rounded-3xl shadow-xl">
                          <img 
                            src={qrCode} 
                            alt="WhatsApp QR Code" 
                            className="w-48 h-48 sm:w-52 sm:h-52 object-contain" 
                          />
                        </div>
                        <p className="text-xs text-slate-300 max-w-xs mx-auto">
                          Abre WhatsApp en tu móvil &gt; <strong>Dispositivos vinculados</strong> &gt; Escanea este código.
                        </p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleGetQR}
                        className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow-md"
                      >
                        Generar código QR
                      </button>
                    )}
                  </div>
                )}

                {/* Status indicator & already connected banner */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      waStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`} />
                    <span className="text-slate-400">
                      {waStatus === 'connected' ? t('onboarding.alreadyConnectedBadge') : t('onboarding.autoAdvanceNotice')}
                    </span>
                  </div>

                  {waStatus === 'connected' && (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300"
                    >
                      <span>Continuar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

              </div>

            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* STEP 2: IMPORTAR CUMPLEAÑOS (WHATSAPP O CALENDARIO)           */}
        {/* ============================================================= */}
        {currentStep === 2 && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300 max-w-2xl mx-auto w-full">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span>Paso 2 de 3</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {t('onboarding.step2TitleMain')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                {t('onboarding.step2SubtitleMain')}
              </p>
            </div>

            {/* 2 BIG INTERACTIVE CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Option A: Sincronizar desde WhatsApp */}
              <div 
                onClick={() => setIsWhatsAppSyncOpen(true)}
                className="group relative p-6 bg-slate-900 hover:bg-slate-850 border-2 border-slate-800 hover:border-emerald-500/60 rounded-3xl transition-all cursor-pointer shadow-xl flex flex-col justify-between space-y-4 hover:scale-[1.02] active:scale-[0.99]"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center justify-center shadow-inner group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <WhatsAppIcon className="w-6 h-6" size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white group-hover:text-emerald-300 transition-colors">
                      {t('onboarding.syncOptionWhatsApp')}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {t('onboarding.syncOptionWhatsAppDesc')}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs font-bold text-emerald-400">
                  <span>Abrir baraja de revisión</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Option B: Importar desde Calendario */}
              <div 
                onClick={() => setIsCalendarSyncOpen(true)}
                className="group relative p-6 bg-slate-900 hover:bg-slate-850 border-2 border-slate-800 hover:border-violet-500/60 rounded-3xl transition-all cursor-pointer shadow-xl flex flex-col justify-between space-y-4 hover:scale-[1.02] active:scale-[0.99]"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-violet-500/15 text-violet-400 border border-violet-500/25 flex items-center justify-center shadow-inner group-hover:bg-violet-500 group-hover:text-white transition-colors">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white group-hover:text-violet-300 transition-colors">
                      {t('onboarding.syncOptionCalendar')}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {t('onboarding.syncOptionCalendarDesc')}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs font-bold text-violet-400">
                  <span>Conectar Google o Apple</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

            </div>

            {/* Bottom Actions: Skip to step 3 */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors inline-flex items-center gap-1.5 px-4 py-2 rounded-xl hover:bg-slate-900"
              >
                <span>{t('onboarding.skipStep2')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* STEP 3: CELEBRACIÓN Y FINALIZACIÓN                            */}
        {/* ============================================================= */}
        {currentStep === 3 && (
          <div className="max-w-xl mx-auto text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30 text-3xl">
              🎉
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                {t('onboarding.readyTitle')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
                {t('onboarding.readySubtitle')}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-left space-y-3 max-w-md mx-auto">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">WhatsApp 100% activo</p>
                  <p className="text-[11px] text-slate-400">Los mensajes se enviarán automáticamente desde tu número.</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">IA Gemini lista</p>
                  <p className="text-[11px] text-slate-400">Mensajes únicos y personalizados sin esfuerzo.</p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={handleFinishOnboarding}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-violet-600 via-indigo-600 to-emerald-600 hover:from-violet-500 hover:to-emerald-500 text-white font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-violet-600/30 transition-all hover:scale-105 active:scale-95 inline-flex items-center justify-center gap-2"
              >
                <span>{t('onboarding.goToDashboard')}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

      </main>

      {/* ─── FOOTER ─────────────────────────────────────────────────── */}
      <footer className="px-6 py-4 border-t border-slate-900 text-center text-slate-600 text-xs font-medium">
        AutoBirthday &bull; {t('settings.versionFooter')}
      </footer>

      {/* MODALS HOOKED INTO ONBOARDING */}
      {isWhatsAppSyncOpen && (
        <WhatsAppSyncDialog 
          onClose={() => {
            setIsWhatsAppSyncOpen(false);
            setCurrentStep(3);
          }} 
        />
      )}

      {isCalendarSyncOpen && (
        <CalendarSyncDialog 
          onClose={() => {
            setIsCalendarSyncOpen(false);
            setCurrentStep(3);
          }} 
        />
      )}

      {/* VIDEO BOTTOM SHEET DRAWER */}
      <WhatsAppVideoDrawer
        isOpen={isVideoDrawerOpen}
        onClose={() => setIsVideoDrawerOpen(false)}
      />

    </div>
  );
}
