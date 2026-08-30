import Image from 'next/image';
import { Sparkles } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in duration-200">
      <div className="relative">
        <div className="absolute -inset-2 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-3xl blur-md animate-pulse" />
        <div className="relative w-20 h-20 rounded-3xl bg-white shadow-lg border border-emerald-100 flex items-center justify-center p-3">
          <Image
            src="/logo.png"
            alt="AutoBirthday"
            width={80}
            height={80}
            className="w-full h-full object-contain drop-shadow-xs"
            priority
          />
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-bold text-slate-800 flex items-center justify-center gap-1.5">
          <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" style={{ animationDuration: '3s' }} />
          <span>Cargando...</span>
        </p>
      </div>

      <div className="w-32 h-1.5 bg-slate-200/80 rounded-full overflow-hidden shadow-inner">
        <div className="h-full bg-gradient-to-r from-[#285953] to-emerald-500 rounded-full w-full animate-pulse" />
      </div>
    </div>
  );
}
