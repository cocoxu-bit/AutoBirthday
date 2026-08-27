import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { InstallPrompt } from "@/components/pwa/install-prompt";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-gradient-festive bg-violet-50/30">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-[100dvh]">
        <Header />
        <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 md:p-6 lg:p-8 pb-28 md:pb-8 max-w-full">
          {children}
        </main>
      </div>
      <MobileNav />
      <InstallPrompt />
    </div>
  );
}
