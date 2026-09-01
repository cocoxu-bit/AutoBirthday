'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminStopImpersonationAction } from '@/app/admin/actions';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

interface ImpersonatedUserInfo {
  id: string;
  email: string;
  name: string;
}

export function ImpersonationBanner() {
  const router = useRouter();
  const [impersonatedUser, setImpersonatedUser] = useState<ImpersonatedUserInfo | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Read the client-accessible cookie
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const cookieVal = getCookie('admin_impersonated_info');
    if (cookieVal) {
      try {
        const decoded = decodeURIComponent(cookieVal);
        const parsed = JSON.parse(decoded);
        setImpersonatedUser(parsed);
      } catch (err) {
        console.warn('Error parsing impersonation cookie:', err);
      }
    }
  }, []);

  if (!impersonatedUser) return null;

  const handleExitImpersonation = async () => {
    setIsExiting(true);
    const toastId = toast.loading('Restaurando tu sesión de Administrador...');

    try {
      const res = await adminStopImpersonationAction();
      if (!res.success || !res.adminCustomToken) {
        toast.error(res.error || 'Error al restaurar sesión.', { id: toastId });
        setIsExiting(false);
        return;
      }

      // Sign back into Firebase Auth as admin
      const credential = await signInWithCustomToken(auth, res.adminCustomToken);
      const idToken = await credential.user.getIdToken(true);

      // Refresh server session cookie
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      // Clear local cookie
      document.cookie = 'admin_impersonated_info=; Max-Age=0; path=/;';

      toast.success('Sesión de Administrador restaurada.', { id: toastId });
      window.location.href = '/admin';
    } catch (err: any) {
      console.error('Exit impersonation error:', err);
      toast.error('Error al salir de la sesión de usuario.', { id: toastId });
      setIsExiting(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white px-3 py-2 sm:py-2.5 shadow-md sticky top-0 z-50 animate-in slide-in-from-top duration-300">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 text-xs">
        
        <div className="flex items-center gap-2 text-center sm:text-left min-w-0">
          <div className="w-6 h-6 rounded-lg bg-black/20 flex items-center justify-center shrink-0">
            <Eye className="w-3.5 h-3.5 text-amber-100" />
          </div>
          <div className="truncate">
            <span className="font-black uppercase tracking-wider text-[10px] bg-black/25 px-1.5 py-0.5 rounded-sm mr-1.5">
              Modo Soporte Admin
            </span>
            <span className="font-medium text-amber-50">
              Viendo cuenta de <strong className="font-black text-white">{impersonatedUser.name}</strong> ({impersonatedUser.email})
            </span>
          </div>
        </div>

        <button
          type="button"
          disabled={isExiting}
          onClick={handleExitImpersonation}
          className="shrink-0 py-1 px-3 bg-black/30 hover:bg-black/50 active:scale-95 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 border border-white/20 disabled:opacity-50"
        >
          {isExiting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saliendo...</span>
            </>
          ) : (
            <>
              <LogOut className="w-3.5 h-3.5 text-amber-200" />
              <span>Volver a mi cuenta Admin</span>
            </>
          )}
        </button>

      </div>
    </div>
  );
}
