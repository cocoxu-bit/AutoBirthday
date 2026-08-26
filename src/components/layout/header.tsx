"use client";

import { usePathname, useRouter } from "next/navigation";
import { LogOut, Cake } from "lucide-react";
import { signOutUser } from "@/lib/firebase/auth";
import { toast } from "sonner";

const routeMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/contacts": "Contactos",
  "/contacts/new": "Nuevo Contacto",
  "/templates": "Plantillas",
  "/templates/new": "Nueva Plantilla",
  "/whatsapp": "WhatsApp",
  "/wishes": "Felicitaciones",
  "/settings": "Configuración",
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  // Match title or sub-routes
  let title = routeMap[pathname];
  if (!title) {
    if (pathname.startsWith('/contacts/')) title = 'Editar Contacto';
    else if (pathname.startsWith('/templates/')) title = 'Editar Plantilla';
    else title = 'AutoBirthday';
  }

  const handleSignOut = async () => {
    try {
      await signOutUser();
      await fetch('/api/auth/session', { method: 'DELETE' });
      toast.success('Sesión cerrada correctamente');
      router.push('/login');
    } catch (err: any) {
      toast.error('Error al cerrar sesión');
    }
  };

  return (
    <header className="h-16 flex items-center justify-between px-3 sm:px-6 bg-white/60 backdrop-blur-md border-b border-slate-200/60 shrink-0">
      <div className="flex items-center gap-2">
        <Cake className="w-5 h-5 text-violet-600 md:hidden" />
        <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-red-600 transition-colors rounded-xl hover:bg-red-50"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Cerrar sesión</span>
        </button>
      </div>
    </header>
  );
}
