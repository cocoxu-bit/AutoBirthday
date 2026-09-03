"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LogOut, Play } from "lucide-react";
import { signOutUser } from "@/lib/firebase/auth";
import { toast } from "sonner";
import { WhatsAppInstanceStatus } from "@/types";
import { VideoGuideModal } from "@/components/onboarding/video-guide-modal";
import { useTranslation } from "@/lib/i18n/context";

export function Header() {
  const router = useRouter();
  const { t } = useTranslation();
  const [waStatus, setWaStatus] = useState<WhatsAppInstanceStatus>('disconnected');
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    async function checkWa() {
      try {
        const res = await fetch('/api/whatsapp/status');
        if (res.ok) {
          const data = await res.json();
          if (data.status) setWaStatus(data.status);
        }
      } catch (err) {
        // silent fail in background
      }
    }
    checkWa();
    const interval = setInterval(checkWa, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOutUser();
      await fetch('/api/auth/session', { method: 'DELETE' });
      toast.success(t('header.logoutSuccess'));
      router.push('/login');
    } catch (err: any) {
      toast.error(t('header.logoutError'));
    }
  };

  return (
    <header className="h-16 flex items-center justify-between px-3 sm:px-6 bg-white/60 backdrop-blur-md border-b border-slate-200/60 shrink-0">
      <div className="flex items-center gap-2.5">
        <Image src="/logo.png" alt="AutoBirthday" width={28} height={28} className="md:hidden object-contain rounded-xl" priority />
        <h1 className="text-lg sm:text-xl font-black text-violet-950 tracking-tight">AutoBirthday</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Video Guides Quick Action */}
        <button
          onClick={() => setGuideOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition-all shadow-sm"
          title={t('header.guidesButton')}
        >
          <Play className="w-3 h-3 fill-violet-600 text-violet-600 ml-0.5" />
          <span className="hidden sm:inline">{t('header.guidesButton')}</span>
          <span className="sm:hidden">{t('header.guidesButton')}</span>
        </button>

        {/* Real-time WhatsApp Status Badge */}
        <Link
          href="/whatsapp"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
            waStatus === 'connected'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : waStatus === 'connecting'
              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 animate-pulse'
              : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
          }`}
          title={waStatus === 'connected' ? 'WhatsApp vinculado y operativo' : 'WhatsApp desconectado (pulsa para vincular)'}
        >
          <span className={`w-2 h-2 rounded-full ${
            waStatus === 'connected'
              ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
              : waStatus === 'connecting'
              ? 'bg-amber-500 animate-ping'
              : 'bg-red-500 shadow-sm shadow-red-500/50'
          }`} />
          <span className="hidden sm:inline">
            {waStatus === 'connected' ? 'WhatsApp Activo' : waStatus === 'connecting' ? 'Conectando...' : 'Reconectar WA'}
          </span>
        </Link>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-red-600 transition-colors rounded-xl hover:bg-red-50"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Cerrar sesión</span>
        </button>
      </div>

      <VideoGuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
      />
    </header>
  );
}
