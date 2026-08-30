"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { onAuthChange } from "@/lib/firebase/auth";
import {
  LayoutDashboard,
  Users,
  FileText,
  Smartphone,
  Gift,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/contacts", icon: Users, label: "Contactos" },
  { href: "/wishes", icon: Gift, label: "Felicitaciones" },
  { href: "/templates", icon: FileText, label: "Plantillas" },
  { href: "/whatsapp", icon: Smartphone, label: "WhatsApp", isWhatsApp: true },
  { href: "/settings", icon: Settings, label: "Configuración" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsub = onAuthChange((user) => {
      if (user?.email?.toLowerCase() === 'lucasjimeneznavarro@gmail.com') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsub();
  }, []);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-full bg-white/40 backdrop-blur-md border-r border-white/20 transition-all duration-300 relative",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex items-center h-16 px-4 border-b border-white/20">
        <Image src="/logo.png" alt="AutoBirthday" width={38} height={38} className="shrink-0 object-contain rounded-xl" priority />
        {!collapsed && (
          <span className="ml-3 font-bold text-xl text-violet-900 truncate">
            AutoBirthday
          </span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                isActive
                  ? "bg-violet-100 text-violet-900 font-semibold shadow-sm"
                  : "text-slate-600 hover:bg-violet-50 hover:text-violet-900"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 shrink-0 transition-colors",
                  isActive ? "text-violet-700" : "text-slate-500 group-hover:text-violet-700"
                )}
              />
              {!collapsed && <span className="ml-3 truncate">{item.label}</span>}
            </Link>
          );
        })}

        {isAdmin && (
          <div className="pt-2">
            <Link
              href="/admin"
              prefetch={true}
              title={collapsed ? "Panel Admin" : undefined}
              className={cn(
                "flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group relative border",
                pathname.startsWith("/admin")
                  ? "bg-amber-100 border-amber-300 text-amber-950 font-bold shadow-xs"
                  : "bg-amber-50/70 border-amber-200/80 text-amber-900 hover:bg-amber-100"
              )}
            >
              <ShieldCheck className="w-5 h-5 shrink-0 text-amber-600" />
              {!collapsed && <span className="ml-3 truncate text-xs font-black">👑 Panel Admin</span>}
            </Link>
          </div>
        )}
      </nav>

      <div className="p-3 border-t border-white/20">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-slate-500 hover:bg-violet-50 hover:text-violet-900 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
}
