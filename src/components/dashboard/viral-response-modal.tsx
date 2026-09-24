'use client';

import { useState } from 'react';
import { Copy, Check, X, MessageCircle, Sparkles, Send } from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/whatsapp-icon';
import { toast } from 'sonner';

interface ViralResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactName: string;
  phone?: string;
  username: string;
}

export function ViralResponseModal({
  isOpen,
  onClose,
  contactName,
  phone,
  username,
}: ViralResponseModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const firstName = contactName.split(' ')[0] || contactName;
  const origin = typeof window !== 'undefined' && !window.location.hostname.includes('localhost')
    ? window.location.origin 
    : (process.env.NEXT_PUBLIC_APP_URL || 'https://autobirthday.vercel.app');
  const collectorUrl = `${origin}/u/${username}`;

  const messageText = `¡De nada ${firstName}! Uso AutoBirthday para que no se me escape ni un cumple con mi mala memoria 😂. Pon tu fecha aquí que luego siempre me olvido de la tuya 👉 ${collectorUrl}`;

  const cleanPhone = (phone || '').replace(/\D/g, '');
  const whatsappUrl = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`
    : `https://wa.me/?text=${encodeURIComponent(messageText)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    toast.success('¡Respuesta copiada al portapapeles!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-5 relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">
              ¿Te ha respondido {firstName}? 💬
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Aprovecha para responderle y que te deje su fecha.
            </p>
          </div>
        </div>

        {/* Message preview box */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Mensaje de respuesta sugerido
          </label>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
            {messageText}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar texto</span>
              </>
            )}
          </button>

          {/* Open WhatsApp Button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-md shadow-emerald-600/20"
          >
            <WhatsAppIcon className="w-4 h-4" size={16} />
            <span>Abrir en WhatsApp</span>
          </a>
        </div>

        {/* Footer tip */}
        <p className="text-[11px] text-center text-slate-400">
          💡 Esta respuesta suele convertir al 40% de tus amigos en usuarios de AutoBirthday.
        </p>

      </div>
    </div>
  );
}
