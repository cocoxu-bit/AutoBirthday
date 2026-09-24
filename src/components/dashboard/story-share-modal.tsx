'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  Share2, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  Palette, 
  ExternalLink,
  Smartphone
} from 'lucide-react';
import { InstagramIcon, TikTokIcon } from '@/components/ui/social-icons';
import { WhatsAppIcon } from '@/components/ui/whatsapp-icon';
import { trackGrowthShareAction, GrowthShareType } from '@/app/(dashboard)/dashboard/growth-actions';
import { toast } from 'sonner';

interface StoryShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  displayName?: string;
}

type ThemeKey = 'purple' | 'sunset' | 'emerald';

interface ThemeConfig {
  name: string;
  gradientTop: string;
  gradientMid: string;
  gradientBottom: string;
  accentColor: string;
  cardBg: string;
  textColor: string;
}

const THEMES: Record<ThemeKey, ThemeConfig> = {
  purple: {
    name: 'Púrpura Neón',
    gradientTop: '#1e1b4b',
    gradientMid: '#581c87',
    gradientBottom: '#030712',
    accentColor: '#c084fc',
    cardBg: '#ffffff',
    textColor: '#0f172a',
  },
  sunset: {
    name: 'Sunset Fiesta',
    gradientTop: '#831843',
    gradientMid: '#c026d3',
    gradientBottom: '#18181b',
    accentColor: '#f472b6',
    cardBg: '#ffffff',
    textColor: '#0f172a',
  },
  emerald: {
    name: 'Esmeralda Vip',
    gradientTop: '#064e3b',
    gradientMid: '#0f766e',
    gradientBottom: '#022c22',
    accentColor: '#34d399',
    cardBg: '#ffffff',
    textColor: '#0f172a',
  },
};

export function StoryShareModal({
  isOpen,
  onClose,
  username,
  displayName = 'Lucas',
}: StoryShareModalProps) {
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>('purple');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [storyBlob, setStoryBlob] = useState<Blob | null>(null);
  const [storyDataUrl, setStoryDataUrl] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const origin = typeof window !== 'undefined' && !window.location.hostname.includes('localhost')
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_APP_URL || 'https://autobirthday.vercel.app');
  const collectorUrl = `${origin}/u/${username}`;
  const shortUrl = collectorUrl.replace(/^https?:\/\//, '');

  // Render 1080 x 1920 Story Canvas
  const drawStory = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsGenerating(true);
    const theme = THEMES[selectedTheme];

    // Set resolution to 1080x1920 (Standard 9:16 vertical story)
    canvas.width = 1080;
    canvas.height = 1920;

    // 1. Background Gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, 1920);
    bgGradient.addColorStop(0, theme.gradientTop);
    bgGradient.addColorStop(0.45, theme.gradientMid);
    bgGradient.addColorStop(1, theme.gradientBottom);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1080, 1920);

    // 2. Ambient glows
    const radialGlow = ctx.createRadialGradient(540, 700, 50, 540, 700, 600);
    radialGlow.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
    radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radialGlow;
    ctx.fillRect(0, 0, 1080, 1920);

    // 3. Festive decorative floating dots & confetti
    const confettiColors = ['#f472b6', '#fbbf24', '#60a5fa', '#34d399', '#c084fc', '#ffffff'];
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    for (let i = 0; i < 45; i++) {
      const x = seededRandom(i * 3) * 1080;
      const y = seededRandom(i * 7) * 1920;
      const radius = 4 + seededRandom(i * 11) * 12;
      const color = confettiColors[Math.floor(seededRandom(i * 13) * confettiColors.length)];

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.35 + seededRandom(i * 17) * 0.45;
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // 4. Header Top Pill
    const pillText = '🎉 CALENDARIO DE CUMPLEAÑOS';
    ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const pillMetrics = ctx.measureText(pillText);
    const pillWidth = pillMetrics.width + 80;
    const pillHeight = 70;
    const pillX = (1080 - pillWidth) / 2;
    const pillY = 140;

    // Pill background
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 35);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(pillText, 540, pillY + 47);

    // 5. Host Title
    const firstName = displayName.split(' ')[0] || displayName;
    ctx.font = '800 68px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`¡Amigos de ${firstName}! 🎂`, 540, 290);

    // 6. Punchy Headline
    ctx.font = '900 78px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#fef08a'; // Pastel yellow
    ctx.fillText('¡No me dejes sin tu cumple!', 540, 390);

    ctx.font = '500 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('Estoy creando mi calendario para acordarme de todos 🥳', 540, 465);

    // 7. Central White Card with QR Code and Link
    const cardW = 860;
    const cardH = 960;
    const cardX = (1080 - cardW) / 2;
    const cardY = 530;

    // Card shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 20;

    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 50);
    ctx.fillStyle = theme.cardBg;
    ctx.fill();
    ctx.restore();

    // Top text inside card
    ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('ESCANEA O ENTRA AL ENLACE', 540, cardY + 75);

    // QR Code Image
    const qrSize = 480;
    const qrX = (1080 - qrSize) / 2;
    const qrY = cardY + 115;

    try {
      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(collectorUrl)}&margin=15&bgcolor=ffffff&color=0f172a`;
      
      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = () => resolve(); // continue even if QR fails
        setTimeout(resolve, 1500); // 1.5s timeout safety
      });

      if (qrImg.complete && qrImg.naturalWidth > 0) {
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
      } else {
        // Fallback icon placeholder if offline
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(qrX, qrY, qrSize, qrSize);
      }
    } catch {}

    // Link Sticker Simulation inside card (looks like Instagram Stories link sticker)
    const stickerW = 760;
    const stickerH = 110;
    const stickerX = (1080 - stickerW) / 2;
    const stickerY = qrY + qrSize + 35;

    ctx.beginPath();
    ctx.roundRect(stickerX, stickerY, stickerW, stickerH, 30);
    ctx.fillStyle = '#f1f5f9';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#cbd5e1';
    ctx.stroke();

    ctx.font = '800 38px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(`🔗 ${shortUrl}`, 540, stickerY + 68);

    // Callout text under sticker
    ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#0284c7';
    ctx.fillText('Toca el link o pon tu fecha en 5 segundos 👉', 540, cardY + cardH - 50);

    // 8. Bottom Footer instructions
    ctx.font = 'bold 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('¡Prometo felicitarte este año por WhatsApp! 📲', 540, 1590);

    ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('AutoBirthday · Sincronización inteligente de cumpleaños', 540, 1660);

    // Convert to Blob and DataURL
    canvas.toBlob((blob) => {
      if (blob) {
        setStoryBlob(blob);
      }
      setStoryDataUrl(canvas.toDataURL('image/png'));
      setIsGenerating(false);
    }, 'image/png');
  }, [selectedTheme, username, displayName, collectorUrl, shortUrl]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        drawStory();
      }, 50);
    }
  }, [isOpen, drawStory]);

  if (!isOpen) return null;

  // Helper: Copy Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(collectorUrl);
    setCopied(true);
    toast.success('¡Enlace copiado! Pégalo como sticker de enlace en tu historia.');
    trackGrowthShareAction('copy_link', username);
    setTimeout(() => setCopied(false), 2500);
  };

  // Helper: Download Story Image
  const handleDownloadImage = () => {
    if (!storyDataUrl) return;
    const link = document.createElement('a');
    link.download = `storie-cumple-${username}.png`;
    link.href = storyDataUrl;
    link.click();
    toast.success('¡Storie descargada en alta resolución!');
    trackGrowthShareAction('download_story', username);
  };

  // Native Native Web Share API
  const handleNativeShare = async () => {
    if (!storyBlob) {
      toast.error('Generando la imagen, espera un instante...');
      return;
    }

    try {
      const file = new File([storyBlob], `cumple-${username}.png`, { type: 'image/png' });
      
      // Auto-copy link so user has it ready in clipboard
      navigator.clipboard.writeText(collectorUrl);

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: '¿Cuándo es tu cumpleaños?',
          text: `Amigos, estoy creando mi calendario para no olvidarme del cumple de nadie este año. Pon tu fecha aquí 👉 ${collectorUrl}`,
          url: collectorUrl,
        });
        toast.success('¡Historia compartida!');
        trackGrowthShareAction('story_instagram', username);
      } else {
        // Fallback: download image and copy link
        handleDownloadImage();
        toast.info('Descargando imagen y enlace copiado. ¡Súbela a tu estado o storie!');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        handleDownloadImage();
      }
    }
  };

  // Share to WhatsApp Status
  const handleWhatsAppStatus = () => {
    handleDownloadImage();
    navigator.clipboard.writeText(collectorUrl);
    trackGrowthShareAction('story_whatsapp', username);
    
    toast.success('¡Imagen descargada y enlace copiado! Abre WhatsApp y súbela a "Mi Estado".', {
      duration: 4000,
    });

    const waText = encodeURIComponent(
      `Amigos, estoy creando mi calendario para no olvidarme del cumple de nadie este año. Pon tu fecha aquí en 5 segundos 👉 ${collectorUrl}`
    );
    window.open(`https://wa.me/?text=${waText}`, '_blank');
  };

  // Share to Instagram Stories
  const handleInstagramStories = () => {
    handleDownloadImage();
    navigator.clipboard.writeText(collectorUrl);
    trackGrowthShareAction('story_instagram', username);

    toast.success('¡Storie descargada y enlace copiado! Pégalo con el sticker de enlace en Instagram.', {
      duration: 5000,
    });

    // Attempt to open Instagram on mobile
    window.location.href = 'instagram://story-camera';
    setTimeout(() => {
      // Fallback web if app doesn't open
      window.open('https://www.instagram.com', '_blank');
    }, 1500);
  };

  // Share to TikTok
  const handleTikTokStories = () => {
    handleDownloadImage();
    navigator.clipboard.writeText(collectorUrl);
    trackGrowthShareAction('story_tiktok', username);

    toast.success('¡Storie descargada y enlace copiado para tu biografía o vídeo de TikTok!');
    window.open('https://www.tiktok.com', '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xl space-y-5 relative max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Creador de Stories 9:16</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900">
            Comparte en tus Estados y Stories 📲
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Generamos una historia personalizada con tu enlace y código QR lista para publicar en tus redes.
          </p>
        </div>

        {/* Main Grid: Story Preview + Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          
          {/* Left Column: Live 9:16 Canvas Story Preview */}
          <div className="md:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-48 sm:w-56 aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl ring-4 ring-slate-900/10 bg-slate-900 flex items-center justify-center">
              <canvas
                ref={canvasRef}
                className="w-full h-full object-cover"
              />
              {isGenerating && (
                <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center text-white text-xs font-bold gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creando imagen...</span>
                </div>
              )}
            </div>

            {/* Theme Selector */}
            <div className="flex items-center gap-2 mt-3">
              {(Object.keys(THEMES) as ThemeKey[]).map((tKey) => (
                <button
                  key={tKey}
                  type="button"
                  onClick={() => setSelectedTheme(tKey)}
                  className={`w-7 h-7 rounded-full transition-transform border-2 ${
                    selectedTheme === tKey ? 'scale-110 ring-2 ring-violet-500 ring-offset-2' : 'hover:scale-105'
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${THEMES[tKey].gradientTop}, ${THEMES[tKey].gradientMid})`,
                    borderColor: THEMES[tKey].accentColor,
                  }}
                  title={THEMES[tKey].name}
                />
              ))}
            </div>
            <span className="text-[11px] text-slate-400 font-bold mt-1">
              Tema: {THEMES[selectedTheme].name}
            </span>
          </div>

          {/* Right Column: Sharing Actions */}
          <div className="md:col-span-7 space-y-3.5">
            
            {/* Primary Action: Native System Share */}
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 transition-all active:scale-[0.98]"
            >
              <Share2 className="w-4 h-4" />
              <span>Compartir Historia Directamente</span>
            </button>

            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pt-1">
              O publica con 1 toque en tu red favorita:
            </div>

            {/* WhatsApp Estados */}
            <button
              type="button"
              onClick={handleWhatsAppStatus}
              className="w-full flex items-center justify-between p-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-950 font-bold text-xs sm:text-sm transition-all active:scale-[0.98] group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <WhatsAppIcon className="w-4 h-4" size={16} />
                </div>
                <div className="text-left">
                  <p className="font-black text-slate-900 group-hover:text-emerald-900">Estados de WhatsApp</p>
                  <p className="text-[11px] text-slate-500 font-normal">Descarga la imagen y abre WhatsApp</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-emerald-600" />
            </button>

            {/* Instagram Stories */}
            <button
              type="button"
              onClick={handleInstagramStories}
              className="w-full flex items-center justify-between p-3 rounded-2xl border border-pink-200 bg-gradient-to-r from-pink-50/60 to-purple-50/60 hover:from-pink-100/60 hover:to-purple-100/60 text-slate-900 font-bold text-xs sm:text-sm transition-all active:scale-[0.98] group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-xs">
                  <InstagramIcon className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="font-black text-slate-900 group-hover:text-purple-900">Instagram Stories</p>
                  <p className="text-[11px] text-slate-500 font-normal">Copia enlace y abre Stories</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-pink-600" />
            </button>

            {/* TikTok */}
            <button
              type="button"
              onClick={handleTikTokStories}
              className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm transition-all active:scale-[0.98] group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-950 text-white flex items-center justify-center shadow-xs">
                  <TikTokIcon className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="font-black text-slate-900">TikTok Stories</p>
                  <p className="text-[11px] text-slate-500 font-normal">Descarga la imagen para tus vídeos</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-600" />
            </button>

            {/* Bottom utility buttons: Copy Link & Download HD */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? '¡Enlace copiado!' : 'Copiar enlace'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadImage}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Descargar PNG HD</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
