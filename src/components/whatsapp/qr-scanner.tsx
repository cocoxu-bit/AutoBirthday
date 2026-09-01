'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface QRScannerProps {
  qrCode: string | null;
  className?: string;
}

export function QRScanner({ qrCode, className }: QRScannerProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center p-3 sm:p-4 bg-white rounded-3xl shadow-lg shadow-violet-500/10 border-2 border-violet-200/80 w-full max-w-[260px] aspect-square mx-auto overflow-hidden",
        !qrCode && "animate-pulse border-violet-100",
        className
      )}
    >
      {qrCode ? (
        <div className="relative w-full h-full flex items-center justify-center animate-in fade-in zoom-in duration-300">
          <img
            src={qrCode.startsWith('data:image') ? qrCode : `data:image/png;base64,${qrCode}`}
            alt="Código QR de WhatsApp"
            className="w-full h-full object-contain rounded-2xl"
          />
          <div className="absolute inset-0 border-2 border-violet-500/20 rounded-2xl pointer-events-none animate-pulse"></div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-violet-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          <p className="text-xs font-bold text-slate-600">Generando Código QR...</p>
        </div>
      )}
    </div>
  );
}
