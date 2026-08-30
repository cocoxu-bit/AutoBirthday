import Image from 'next/image';
import { Sparkles } from 'lucide-react';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#f2f8f6] via-white to-[#e8f4f1] p-4 select-none">
      
      {/* Decorative ambient background glows */}
      <div className="absolute w-80 h-80 rounded-full bg-emerald-400/15 blur-3xl -top-10 -left-10 pointer-events-none animate-pulse" />
      <div className="absolute w-80 h-80 rounded-full bg-teal-400/15 blur-3xl -bottom-10 -right-10 pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Main Floating Brand Card */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Glowing Logo Container */}
        <div className="relative">
          <div className="absolute -inset-3 bg-gradient-to-r from-emerald-400/30 to-teal-400/30 rounded-3xl blur-lg animate-pulse" />
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white shadow-xl shadow-emerald-900/10 border border-emerald-100/90 flex items-center justify-center p-3.5">
            <Image
              src="/logo.png"
              alt="AutoBirthday"
              width={96}
              height={96}
              className="w-full h-full object-contain drop-shadow-sm"
              priority
            />
          </div>
        </div>

        {/* Brand Name & Loading Subtitle */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-[#285953] to-emerald-700 bg-clip-text text-transparent tracking-tight">
            AutoBirthday
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin" style={{ animationDuration: '3s' }} />
            <span>Cargando tus felicitaciones...</span>
          </p>
        </div>

        {/* Sleek Pulsing Progress Line */}
        <div className="w-36 h-1.5 bg-slate-200/70 rounded-full overflow-hidden shadow-inner">
          <div className="h-full bg-gradient-to-r from-[#285953] to-emerald-500 rounded-full w-full animate-pulse" />
        </div>

      </div>

    </div>
  );
}
