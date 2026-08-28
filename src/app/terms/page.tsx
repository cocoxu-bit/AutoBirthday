import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-slate-200/80 space-y-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-violet-600 font-bold hover:underline mb-2">
          <ArrowLeft className="w-4 h-4" /> Volver al Inicio
        </Link>
        
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Condiciones del Servicio</h1>
            <p className="text-xs text-slate-500">Última actualización: Agosto 2026</p>
          </div>
        </div>

        <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
          <h2 className="text-base font-bold text-slate-800">1. Aceptación de los Términos</h2>
          <p>
            Al utilizar AutoBirthday, aceptas estos términos y condiciones. Si no estás de acuerdo, te rogamos que no utilices nuestros servicios.
          </p>

          <h2 className="text-base font-bold text-slate-800">2. Descripción del Servicio</h2>
          <p>
            AutoBirthday es una plataforma SaaS que permite a los usuarios gestionar recordatorios de cumpleaños y automatizar el envío de felicitaciones personalizadas por WhatsApp.
          </p>

          <h2 className="text-base font-bold text-slate-800">3. Uso Responsable</h2>
          <p>
            El usuario se compromete a utilizar la plataforma únicamente para comunicaciones legítimas con sus propios contactos y de conformidad con las políticas de uso de WhatsApp y Google.
          </p>

          <h2 className="text-base font-bold text-slate-800">4. Contacto</h2>
          <p>
            Para cualquier duda sobre estas condiciones: <strong>luquitasjimenez@gmail.com</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
