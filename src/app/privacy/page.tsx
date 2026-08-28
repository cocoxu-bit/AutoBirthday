import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-slate-200/80 space-y-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-violet-600 font-bold hover:underline mb-2">
          <ArrowLeft className="w-4 h-4" /> Volver al Inicio
        </Link>
        
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Política de Privacidad</h1>
            <p className="text-xs text-slate-500">Última actualización: Agosto 2026</p>
          </div>
        </div>

        <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
          <h2 className="text-base font-bold text-slate-800">1. Información que recopilamos</h2>
          <p>
            AutoBirthday recopila únicamente la información necesaria para programar y enviar felicitaciones de cumpleaños: nombre del contacto, fecha de cumpleaños, número de teléfono o identificador de WhatsApp, y preferencias de personalización configuradas por el usuario.
          </p>

          <h2 className="text-base font-bold text-slate-800">2. Uso de la API de Google y Calendarios</h2>
          <p>
            El acceso a Google Calendar se utiliza exclusivamente en modo de solo lectura para extraer eventos anuales de cumpleaños y aniversarios autorizados explícitamente por el usuario. No almacenamos credenciales de Google ni compartimos información con terceros.
          </p>

          <h2 className="text-base font-bold text-slate-800">3. Seguridad de los Datos</h2>
          <p>
            Toda la información viaja cifrada mediante protocolos SSL/TLS y se almacena en bases de datos protegidas con reglas de autenticación estrictas. Las sesiones de WhatsApp se ejecutan en contenedores aislados.
          </p>

          <h2 className="text-base font-bold text-slate-800">4. Contacto</h2>
          <p>
            Para consultas relacionadas con la privacidad de tus datos, puedes contactarnos en: <strong>luquitasjimenez@gmail.com</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
