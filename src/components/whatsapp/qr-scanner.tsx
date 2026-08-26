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
        "relative flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm border-2 border-violet-200 w-[280px] h-[280px] overflow-hidden",
        !qrCode && "animate-pulse border-violet-100",
        className
      )}
    >
      {qrCode ? (
        <div className="relative w-full h-full animate-in fade-in zoom-in duration-300">
          {/* Using next/image or standard img tag for base64 */}
          <img
            src={qrCode.startsWith('data:image') ? qrCode : `data:image/png;base64,${qrCode}`}
            alt="Código QR de WhatsApp"
            className="w-full h-full object-contain"
          />
          <div className="absolute inset-0 border-4 border-violet-500/20 rounded-xl pointer-events-none animate-pulse"></div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-violet-400 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm font-medium">Generando QR...</p>
        </div>
      )}
    </div>
  );
}
