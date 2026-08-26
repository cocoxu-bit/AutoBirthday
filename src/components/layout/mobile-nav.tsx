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
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-lg border-t border-white/20 pb-safe z-50">
      <div className="flex items-center justify-around h-full px-2">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                isActive ? "text-violet-700" : "text-slate-500 hover:text-violet-900"
              )}
            >
              <item.icon className={cn("w-6 h-6", isActive && "fill-violet-100")} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
