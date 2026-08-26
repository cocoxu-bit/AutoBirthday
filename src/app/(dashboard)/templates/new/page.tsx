import { TemplateEditor } from '@/components/templates/template-editor';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Nueva Plantilla | AutoBirthday',
};

export default function NewTemplatePage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/templates" 
          className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nueva Plantilla</h1>
          <p className="text-slate-500 mt-1">Crea un mensaje reutilizable con variables dinámicas.</p>
        </div>
      </div>

      <TemplateEditor />
    </div>
  );
}
