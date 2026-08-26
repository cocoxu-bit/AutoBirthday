"use client";

import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
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
    <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-white/40 backdrop-blur-md border-b border-white/20">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Cerrar sesión</span>
        </button>
      </div>
    </header>
  );
}
