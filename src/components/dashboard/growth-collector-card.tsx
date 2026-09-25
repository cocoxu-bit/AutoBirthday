'use client';

import { useState } from 'react';
import { Copy, Check, Sparkles, Loader2 } from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/whatsapp-icon';
import { InstagramIcon } from '@/components/ui/social-icons';
import { generateStoryBlob } from '@/lib/growth/story-generator';
import { trackGrowthShareAction } from '@/app/(dashboard)/dashboard/growth-actions';
import { toast } from 'sonner';

interface GrowthCollectorCardProps {
  username: string;
  displayName?: string;
}

export function GrowthCollectorCard({ username, displayName = 'Lucas' }: GrowthCollectorCardProps) {
  const [copied, setCopied] = useState(false);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);

  const origin = typeof window !== 'undefined' && !window.location.hostname.includes('localhost')
    ? window.location.origin 
    : (process.env.NEXT_PUBLIC_APP_URL || 'https://autobirthday.vercel.app');
  const collectorUrl = `${origin}/u/${username}`;

  const shareText = `Amigos, estoy creando mi calendario para no olvidarme del cumple de nadie este año. Pon tu fecha aquí en 5 segundos 👉 ${collectorUrl}`;
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  // 1. Compartir en WhatsApp con el mensaje ya listo
  const handleWhatsAppShare = () => {
    trackGrowthShareAction('whatsapp_chat', username);
    window.open(whatsappShareUrl, '_blank');
  };

  // 2. Compartir en Instagram con la Storie 9:16 ya creada directamente
  const handleInstagramShare = async () => {
    if (isGeneratingStory) return;
    setIsGeneratingStory(true);

    try {
      // Copiar enlace al portapapeles de inmediato para que lo tenga disponible para el sticker de enlace
      await navigator.clipboard.writeText(collectorUrl);

      // Generar imagen 9:16 en alta resolución en segundo plano
      const blob = await generateStoryBlob({
        username,
        displayName,
        collectorUrl,
      });

      if (blob) {
        const file = new File([blob], `storie-cumple-${username}.png`, { type: 'image/png' });

        // Si el navegador móvil soporta compartir archivos nativos (iOS Safari, Android Chrome)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          trackGrowthShareAction('story_instagram', username);
          await navigator.share({
            files: [file],
            title: '¿Cuándo es tu cumpleaños?',
            text: shareText,
            url: collectorUrl,
          });
          toast.success('¡Storie lista! Pega el enlace en tu historia.');
          return;
        }

        // Descarga automática en segundo plano
        const dataUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `storie-cumple-${username}.png`;
        link.href = dataUrl;
        link.click();
        setTimeout(() => URL.revokeObjectURL(dataUrl), 5000);
      }

      toast.success('¡Storie descargada y enlace copiado! Pégalo con el sticker de enlace en Instagram.', {
        duration: 4500,
      });
      trackGrowthShareAction('story_instagram', username);

      // Intentar abrir la cámara de stories de Instagram en móvil o fallback a web
      window.location.href = 'instagram://story-camera';
      setTimeout(() => {
        window.open('https://www.instagram.com', '_blank');
      }, 1500);
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        toast.error('No se pudo generar la historia');
      }
    } finally {
      setIsGeneratingStory(false);
    }
  };

  // 3. Copiar enlace directo
  const handleCopyLink = () => {
    navigator.clipboard.writeText(collectorUrl);
    setCopied(true);
    toast.success('¡Enlace copiado al portapapeles!');
    trackGrowthShareAction('copy_link', username);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
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
            Comparte tu enlace personal o publica tu Storie para que tus amigos apunten su fecha automáticamente.
          </p>
        </div>

        {/* Right: Only the 3 Action Pills */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
          
          {/* 1. Botón WhatsApp */}
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-emerald-950/30 active:scale-[0.98] whitespace-nowrap cursor-pointer"
          >
            <WhatsAppIcon className="w-4 h-4 shrink-0" size={16} />
            <span>WhatsApp</span>
          </button>

          {/* 2. Botón Instagram Storie Directa */}
          <button
            type="button"
            onClick={handleInstagramShare}
            disabled={isGeneratingStory}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:opacity-95 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-pink-950/30 active:scale-[0.98] disabled:opacity-75 whitespace-nowrap cursor-pointer"
          >
            {isGeneratingStory ? (
              <>
                <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                <span>Creando Storie...</span>
              </>
            ) : (
              <>
                <InstagramIcon className="w-4 h-4 shrink-0" />
                <span>Instagram</span>
              </>
            )}
          </button>

          {/* 3. Botón Copiar Enlace */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm transition-all active:scale-[0.98] whitespace-nowrap cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 shrink-0 text-slate-300" />
                <span>Copiar enlace</span>
              </>
            )}
          </button>

        </div>

      </div>
    </div>
  );
}
