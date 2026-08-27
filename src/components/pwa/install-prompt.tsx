'use client';

import { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Sparkles } from 'lucide-react';

const COOLDOWN_DAYS = 14; // No volver a molestar durante 14 días si se cierra

function isDismissedInCooldown(): boolean {
  try {
    const dismissedAt = localStorage.getItem('autobirthday_pwa_dismissed');
    if (!dismissedAt) return false;
    const daysSince = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
    return daysSince < COOLDOWN_DAYS;
  } catch {
    return false;
  }
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker safely
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      if (window.location.protocol === 'https:' || window.location.hostname === 'localhost') {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => console.log('✅ Service Worker registered:', reg.scope))
          .catch((err) => console.warn('Service Worker registration failed:', err));
      }
    }

    // 2. Check if already running in standalone mode (installed)
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(isStandaloneMode);
    if (isStandaloneMode) return;

    // 3. If user closed it recently, don't show
    if (isDismissedInCooldown()) return;

    // 4. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice && !isStandaloneMode) {
      const timer = setTimeout(() => {
        if (!isDismissedInCooldown()) {
          setShowPrompt(true);
        }
      }, 4000); // 4 seconds delay
      return () => clearTimeout(timer);
    }

    // 5. Detect Android / Chromium beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isDismissedInCooldown()) {
        setShowPrompt(true);
      }
    };

    const handleAppInstalled = () => {
      setShowPrompt(false);
      try {
        localStorage.setItem('autobirthday_pwa_installed', 'true');
      } catch {}
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
      try {
        localStorage.setItem('autobirthday_pwa_installed', 'true');
      } catch {}
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    try {
      localStorage.setItem('autobirthday_pwa_dismissed', Date.now().toString());
    } catch {}
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-slide-up">
      <div className="bg-slate-900/95 text-white p-4 sm:p-5 rounded-3xl border border-slate-700 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        
        {/* Decorative Glow */}
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-violet-600/30 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Cerrar aviso (no volver a mostrar en 14 días)"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5">
          {/* App Icon */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 flex items-center justify-center text-2xl shadow-md shrink-0 border border-violet-400/30">
            🎂
          </div>

          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-violet-400">Instalar App</span>
              <Sparkles className="w-3 h-3 text-amber-400" />
            </div>
            <h4 className="text-sm font-bold text-white mt-0.5">
              AutoBirthday en tu pantalla
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {isIOS 
                ? 'Instálala en tu iPhone para abrirla a pantalla completa y sin barras de navegación.'
                : 'Accede a tus cumpleaños en 1 toque directo desde tu pantalla de inicio.'}
            </p>

            {/* iOS Safari Instructions */}
            {isIOS && (
              <div className="mt-3 p-2.5 bg-slate-800/90 rounded-xl border border-slate-700 text-[11px] text-slate-300 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Share className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>1. Pulsa el botón <strong>Compartir</strong> en Safari (⎋).</span>
                </div>
                <div className="flex items-center gap-2">
                  <PlusSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>2. Elige <strong>"Añadir a pantalla de inicio"</strong>.</span>
                </div>
              </div>
            )}

            {/* Android / Chromium 1-Click Install Button */}
            {!isIOS && deferredPrompt && (
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={handleInstallClick}
                  className="inline-flex items-center justify-center gap-2 flex-1 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-violet-600/30 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Instalar App</span>
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-3 py-2.5 text-xs text-slate-400 hover:text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Ahora no
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
