'use client';

import { useState } from 'react';
import { Copy, Check, Sparkles, Smartphone } from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/whatsapp-icon';
import { InstagramIcon, TikTokIcon } from '@/components/ui/social-icons';
import { StoryShareModal } from './story-share-modal';
import { trackGrowthShareAction } from '@/app/(dashboard)/dashboard/growth-actions';
import { toast } from 'sonner';

interface GrowthCollectorCardProps {
  username: string;
  displayName?: string;
}

export function GrowthCollectorCard({ username, displayName }: GrowthCollectorCardProps) {
  const [copied, setCopied] = useState(false);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);

  const origin = typeof window !== 'undefined' && !window.location.hostname.includes('localhost')
    ? window.location.origin 
    : (process.env.NEXT_PUBLIC_APP_URL || 'https://autobirthday.vercel.app');
  const collectorUrl = `${origin}/u/${username}`;

  const shareText = `Amigos, estoy creando mi calendario para no olvidarme del cumple de nadie este año. Pon tu fecha aquí en 5 segundos 👉 ${collectorUrl}`;
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(collectorUrl);
    setCopied(true);
    toast.success('¡Enlace copiado al portapapeles!');
    trackGrowthShareAction('copy_link', username);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShareClick = () => {
    trackGrowthShareAction('whatsapp_chat', username);
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-900 via-indigo-950 to-slate-950 p-5 sm:p-6 text-white shadow-md border border-violet-800/40">
        {/* Background ambient glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-fuchsia-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          
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
              Comparte tu enlace personal o publica tu Storie en Instagram, TikTok o WhatsApp para que tus amigos apunten su fecha automáticamente.
            </p>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            
            {/* 1. Direct WhatsApp Chat Share */}
            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleWhatsAppShareClick}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-md shadow-emerald-950/40 active:scale-[0.98]"
            >
              <WhatsAppIcon className="w-4 h-4" size={16} />
              <span>WhatsApp Grupos</span>
            </a>

            {/* 2. Direct WhatsApp Status Share */}
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackGrowthShareAction('story_whatsapp', username)}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl bg-emerald-700/80 hover:bg-emerald-600 border border-emerald-500/40 text-white font-black text-xs transition-all shadow-md active:scale-[0.98]"
            >
              <WhatsAppIcon className="w-4 h-4" size={16} />
              <span>Mi Estado</span>
            </a>

            {/* 3. Instagram Direct */}
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(collectorUrl);
                toast.success('¡Enlace copiado! Pégalo con el sticker de enlace en Instagram Stories.');
                trackGrowthShareAction('story_instagram', username);
                window.location.href = 'instagram://story-camera';
                setTimeout(() => window.open('https://instagram.com', '_blank'), 1200);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:opacity-90 text-white font-black text-xs transition-all shadow-md shadow-pink-950/40 active:scale-[0.98]"
            >
              <InstagramIcon className="w-4 h-4" />
              <span>Instagram</span>
            </button>

            {/* 4. Copy Link Button */}
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition-all active:scale-[0.98]"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar</span>
                </>
              )}
            </button>

            {/* 5. Storie 9:16 Modal Button */}
            <button
              type="button"
              onClick={() => setIsStoryModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl bg-violet-800/40 hover:bg-violet-800/70 border border-violet-600/40 text-violet-200 font-bold text-xs transition-all active:scale-[0.98]"
              title="Personalizar imagen vertical 9:16 para Stories"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Storie 9:16</span>
            </button>

          </div>

        </div>
      </div>

      {/* 9:16 Story Creator Modal */}
      <StoryShareModal
        isOpen={isStoryModalOpen}
        onClose={() => setIsStoryModalOpen(false)}
        username={username}
        displayName={displayName}
      />
    </>
  );
}
