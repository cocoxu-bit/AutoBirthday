import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from '@/lib/firebase/admin';
import { getAdminAnalyticsDataAction } from './actions';
import { AdminDashboard } from '@/components/admin/admin-dashboard';

const ADMIN_EMAILS = ['lucasjimeneznavarro@gmail.com'];

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Panel de Administración | AutoBirthday',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;

  if (!sessionCookie) {
    redirect('/login?redirect=/admin');
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, false);
    const email = (decoded.email || '').toLowerCase().trim();

    if (!ADMIN_EMAILS.includes(email)) {
      redirect('/dashboard');
    }
  } catch {
    redirect('/login');
  }

  const res = await getAdminAnalyticsDataAction();

  if (!res.success || !res.data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-md shadow-xs">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Error al cargar analítica</h2>
          <p className="text-sm text-slate-500">{res.error || 'Ocurrió un error inesperado.'}</p>
        </div>
      </div>
    );
  }

  return <AdminDashboard initialData={res.data} />;
}
