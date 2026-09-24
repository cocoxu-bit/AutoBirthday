'use client';

import { useState } from 'react';
import { Copy, Check, Share2, Sparkles, Send } from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/whatsapp-icon';
import { toast } from 'sonner';

interface GrowthCollectorCardProps {
  username: string;
}

export function GrowthCollectorCard({ username }: GrowthCollectorCardProps) {
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== 'undefined' && !window.location.hostname.includes('localhost')
    ? window.location.origin 
    : (process.env.NEXT_PUBLIC_APP_URL || 'https://autobirthday.vercel.app');
  const collectorUrl = `${origin}/u/${username}`;

  const shareText = `Amigos, estoy armando mi calendario para no olvidarme del cumple de nadie este año. Pon tu fecha aquí en 5 segundos 👉 ${collectorUrl}`;
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(collectorUrl);
    setCopied(true);
    toast.success('¡Enlace copiado al portapapeles!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-900 via-indigo-950 to-slate-950 p-5 sm:p-6 text-white shadow-md border border-violet-800/40">
      {/* Background ambient glow */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-fuchsia-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        
        {/* Left: Text & Pitch */}
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-300 text-[11px] font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Recolector Automático</span>
          </div>

          <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
            Completa tu lista de cumpleaños sin mover un dedo 🎁
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
            Comparte tu enlace personal en tu estado o grupos de WhatsApp para que tus amigos apunten su fecha directamente en tu agenda.
          </p>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          
          {/* Copy Link Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition-all active:scale-[0.98]"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar Enlace</span>
              </>
            )}
          </button>

          {/* Direct Share on WhatsApp */}
          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-md shadow-emerald-950/40 active:scale-[0.98]"
          >
            <WhatsAppIcon className="w-4 h-4" size={16} />
            <span>Compartir en WhatsApp</span>
          </a>

        </div>

      </div>
    </div>
  );
}
