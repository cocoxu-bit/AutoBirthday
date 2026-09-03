'use client';

import { useEffect, useRef } from 'react';
import { X, Play } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';

interface WhatsAppVideoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WhatsAppVideoDrawer({ isOpen, onClose }: WhatsAppVideoDrawerProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Top Clickable Area (Dismiss on click outside, user sees the web behind) */}
      <div 
        className="flex-1 w-full cursor-pointer" 
        onClick={onClose}
        aria-label="Cerrar vídeo"
      />

      {/* Bottom Sheet Container */}
      <div className="w-full max-w-lg mx-auto bg-slate-900 border-t-2 border-x-2 border-slate-700/80 rounded-t-[2.5rem] shadow-2xl flex flex-col max-h-[88vh] overflow-hidden animate-in slide-in-from-bottom-full duration-300">
        
        {/* Pull handle indicator */}
        <div 
          className="w-12 h-1.5 bg-slate-700 hover:bg-slate-600 rounded-full mx-auto mt-3 shrink-0 cursor-pointer transition-colors" 
          onClick={onClose} 
        />

        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/30">
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                {t('onboarding.videoHelpTitle')}
              </h3>
              <p className="text-[11px] text-slate-400">
                {t('onboarding.videoHelpBadge')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body (Scrollable if needed, centered video) */}
        <div className="p-4 sm:p-5 overflow-y-auto flex flex-col items-center space-y-4">
          
          {/* Vertical Video 9:16 in a Sleek Phone Mockup */}
          <div className="relative w-full max-w-[240px] sm:max-w-[260px] aspect-[9/16] max-h-[52vh] bg-black rounded-[2rem] p-2 shadow-2xl border-4 border-slate-800 ring-1 ring-emerald-500/30 overflow-hidden shrink-0">
            <video
              ref={videoRef}
              src="/videos/WA.mp4"
              autoPlay
              loop
              playsInline
              controls
              className="w-full h-full object-cover rounded-[1.5rem]"
            />
          </div>

          {/* Step-by-step guidance under the video */}
          <div className="w-full space-y-2 text-xs">
            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center gap-2.5 text-slate-300">
              <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 font-bold flex items-center justify-center text-[11px] shrink-0">1</span>
              <span>Abre <strong>WhatsApp</strong> en tu teléfono &gt; <strong>Ajustes</strong> (o ⋮).</span>
            </div>
            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center gap-2.5 text-slate-300">
              <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 font-bold flex items-center justify-center text-[11px] shrink-0">2</span>
              <span>Toca en <strong>Dispositivos vinculados</strong> &gt; <strong>Vincular un dispositivo</strong>.</span>
            </div>
            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center gap-2.5 text-slate-300">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[11px] shrink-0">3</span>
              <span>Elige <strong>Vincular con el número de teléfono</strong> y escribe el código de 8 dígitos.</span>
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20"
          >
            Entendido, volver a la pantalla
          </button>
        </div>

      </div>
    </div>
  );
}
