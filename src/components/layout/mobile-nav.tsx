"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Smartphone, Gift, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Inicio" },
  { href: "/whatsapp", icon: Smartphone, label: "WhatsApp" },
  { href: "/contacts", icon: Users, label: "Contactos" },
  { href: "/wishes", icon: Gift, label: "Saludos" },
  { href: "/settings", icon: Settings, label: "Ajustes" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-xl border-t border-slate-200/80 shadow-lg shadow-slate-900/5 z-40">
      <div className="flex items-center justify-around h-full px-1 max-w-md mx-auto">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-1 transition-all rounded-xl",
                isActive 
                  ? "text-violet-700 font-bold" 
                  : "text-slate-500 hover:text-slate-900 font-medium"
              )}
            >
              <div className={cn(
                "p-1 rounded-xl transition-all",
                isActive && "bg-violet-100/80 text-violet-700"
              )}>
                <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[10px] leading-tight mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
