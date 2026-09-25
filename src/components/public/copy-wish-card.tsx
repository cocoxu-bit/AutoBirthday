'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface CopyWishCardProps {
  label: string;
  text: string;
}

export function CopyWishCard({ label, text }: CopyWishCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('¡Frase copiada al portapapeles! 🎉');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('No se pudo copiar automáticamente');
    }
  };

  return (
    <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between hover:border-slate-300 transition-all">
      <div className="space-y-2">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md">
          {label}
        </span>
        <p className="text-sm text-slate-800 leading-relaxed font-normal whitespace-pre-wrap select-all">
          "{text}"
        </p>
      </div>

      <button
        type="button"
        onClick={handleCopy}
        className="self-start inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-800 transition-colors pt-1 cursor-pointer"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-emerald-600 font-bold">¡Copiado!</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            <span>Copiar frase</span>
          </>
        )}
      </button>
    </div>
  );
}
