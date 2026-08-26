'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Smartphone, CheckCircle2, AlertTriangle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { WhatsAppInstanceStatus } from '@/types';

interface ConnectionStatusCardProps {
  initialStatus?: WhatsAppInstanceStatus;
  initialPhone?: string | null;
}

export function ConnectionStatusCard({ initialStatus = 'disconnected', initialPhone = null }: ConnectionStatusCardProps) {
  const [status, setStatus] = useState<WhatsAppInstanceStatus>(initialStatus);
  const [phone, setPhone] = useState<string | null>(initialPhone);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch('/api/whatsapp/status');
        if (res.ok) {
          const data = await res.json();
          if (data.status) setStatus(data.status);
          if (data.phoneNumber) setPhone(data.phoneNumber);
        }
      } catch (err) {
        console.warn('Failed to check WhatsApp status:', err);
      }
    }

    checkStatus();
    const interval = setInterval(checkStatus, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, []);

  if (status === 'connected') {
    return (
      <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-teal-500/10 border border-emerald-500/20 rounded-2xl sm:rounded-3xl backdrop-blur-md shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">WhatsApp Conectado y Activo</h4>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Operativo
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {phone ? `Vinculado a ${phone}.` : 'Sesión vinculada.'} Las felicitaciones automáticas se enviarán a su hora.
            </p>
          </div>
        </div>
        <Link
          href="/whatsapp"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-100/60 hover:bg-emerald-100 px-3.5 py-1.5 rounded-xl transition-colors shrink-0 self-end sm:self-center"
        >
          <span>Gestionar</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  if (status === 'connecting') {
    return (
      <div className="p-4 sm:p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl sm:rounded-3xl backdrop-blur-md shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Conectando WhatsApp...</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Sincronizando sesión y credenciales.
            </p>
          </div>
        </div>
        <Link
          href="/whatsapp"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-100 px-3.5 py-1.5 rounded-xl transition-colors shrink-0"
        >
          <span>Ver estado</span>
        </Link>
      </div>
    );
  }

  // Disconnected or Session Expired
  return (
    <div className="p-5 sm:p-6 bg-gradient-to-r from-red-500/15 via-rose-500/10 to-amber-500/10 border-2 border-red-500/30 rounded-2xl sm:rounded-3xl backdrop-blur-md shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-pulse-slow">
      <div className="flex items-start sm:items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-600 flex items-center justify-center shrink-0 shadow-inner">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm sm:text-base font-bold text-slate-900">WhatsApp Desconectado</h4>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-700 animate-bounce">
              Requiere Acción
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
            Tu sesión no está activa. Para que AutoBirthday pueda enviar o proponerte felicitaciones, vincula tu WhatsApp en 10 segundos.
          </p>
        </div>
      </div>
      <Link
        href="/whatsapp"
        className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-red-500/25 transition-all hover:scale-105 shrink-0"
      >
        <Smartphone className="w-4 h-4" />
        <span>Vincular WhatsApp Ahora</span>
      </Link>
    </div>
  );
}
