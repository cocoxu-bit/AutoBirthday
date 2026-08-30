import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';
import { getTemplates } from '@/lib/firebase/firestore';
import { TemplateCard } from '@/components/templates/template-card';
import { LayoutTemplate, Plus } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Plantillas | AutoBirthday',
};

async function getUserId() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  if (!sessionCookie) return null;
  
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, false);
    return decoded.uid;
  } catch (error) {
    return null;
  }
}

export default async function TemplatesPage() {
  const userId = await getUserId();
  if (!userId) return null;

  const templates = await getTemplates(userId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mis Plantillas</h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4" />
            {templates.length} {templates.length === 1 ? 'plantilla' : 'plantillas'}
          </p>
        </div>
        <Link 
          href="/templates/new" 
          className="flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors shadow-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Plantilla</span>
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-16 bg-white/40 backdrop-blur rounded-2xl border border-white/20 shadow-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-violet-100 text-violet-500 mb-4">
            <LayoutTemplate className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No tienes plantillas</h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            Crea tu primera plantilla para usarla con tus contactos. Puedes usar variables como {'{nombre}'} y {'{edad}'}.
          </p>
          <Link 
            href="/templates/new" 
            className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Plantilla</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {templates.map(template => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}
    </div>
  );
}
