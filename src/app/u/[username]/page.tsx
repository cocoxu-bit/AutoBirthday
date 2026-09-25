import { notFound } from 'next/navigation';
import { getUserByUsername } from '@/lib/user/slug';
import { BirthdayCollectorForm } from '@/components/public/birthday-collector-form';
import { PageTrafficTracker } from '@/components/analytics/page-traffic-tracker';
import { Metadata } from 'next';
import Link from 'next/link';
import { Cake } from 'lucide-react';

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const host = await getUserByUsername(username);

  if (!host) {
    return {
      title: 'Cumpleaños | AutoBirthday',
    };
  }

  return {
    title: `¿Cuándo es tu cumpleaños? | Amigo de ${host.displayName}`,
    description: `Apunta tu fecha para que ${host.displayName} no se olvide de felicitarte por WhatsApp este año.`,
    openGraph: {
      title: `¿Cuándo es tu cumpleaños? | Amigo de ${host.displayName}`,
      description: `Apunta tu fecha para que ${host.displayName} no se olvide de felicitarte por WhatsApp este año.`,
      type: 'website',
    },
  };
}

export default async function PublicCollectorPage({ params }: PageProps) {
  const { username } = await params;
  const host = await getUserByUsername(username);

  if (!host) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-sm shadow-sm space-y-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <Cake className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">Enlace no encontrado</h2>
            <p className="text-xs text-slate-500">
              Este enlace de cumpleaños no existe o ha sido desactivado.
            </p>
          </div>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
          >
            Ir a AutoBirthday
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-100/60 via-purple-50/40 to-rose-100/60 flex flex-col justify-between p-4 sm:p-6 md:p-10 relative overflow-hidden">
      <PageTrafficTracker
        path={`/u/${host.username}`}
        title={`Recolector de ${host.displayName}`}
        category="viral_collector"
      />
      {/* Decorative festive background blurs */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-violet-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-rose-400/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top minimal brand */}
      <header className="w-full max-w-md mx-auto flex items-center justify-center py-2">
        <Link href="/" className="inline-flex items-center gap-2 font-black text-slate-900 text-sm tracking-tight hover:opacity-80 transition-opacity">
          <span className="w-7 h-7 rounded-xl bg-violet-600 text-white flex items-center justify-center text-xs shadow-sm">
            🎂
          </span>
          <span>AutoBirthday</span>
        </Link>
      </header>

      {/* Center Form */}
      <div className="my-auto py-6">
        <BirthdayCollectorForm host={host} />
      </div>

      {/* Minimal Footer */}
      <footer className="w-full max-w-md mx-auto text-center py-4">
        <p className="text-[11px] text-slate-400 font-medium">
          Privacidad garantizada · Solo {host.displayName} verá tu fecha de cumpleaños
        </p>
      </footer>
    </main>
  );
}
