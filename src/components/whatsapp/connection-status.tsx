'use client';

import { cn } from '@/lib/utils';
import { WhatsAppInstanceStatus } from '@/types';

interface ConnectionStatusProps {
  status: WhatsAppInstanceStatus;
  className?: string;
}

export function ConnectionStatus({ status, className }: ConnectionStatusProps) {
  const config = {
    connected: {
      color: "bg-emerald-500",
      text: "text-emerald-700",
      bg: "bg-emerald-100",
      label: "Conectado",
      ping: false
    },
    connecting: {
      color: "bg-amber-500",
      text: "text-amber-700",
      bg: "bg-amber-100",
      label: "Conectando...",
      ping: true
    },
    disconnected: {
      color: "bg-red-500",
      text: "text-red-700",
      bg: "bg-red-100",
      label: "Desconectado",
      ping: false
    }
  };

  const current = config[status] || config.disconnected;

  return (
    <div className={cn("inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border border-white/50 backdrop-blur-sm shadow-sm", current.bg, className)}>
      <div className="relative flex h-2.5 w-2.5">
        {current.ping && (
          <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", current.color)}></span>
        )}
        <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", current.color)}></span>
      </div>
      <span className={cn("text-xs font-semibold", current.text)}>
        {current.label}
      </span>
    </div>
  );
}
