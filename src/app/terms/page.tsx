import Link from 'next/link';
import { ArrowLeft, FileText, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Condiciones del Servicio | AutoBirthday',
  description: 'Términos y condiciones de uso de la plataforma AutoBirthday.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-6 sm:p-10 md:p-12 rounded-3xl shadow-sm border border-slate-200/80 space-y-6">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-violet-700 font-bold hover:text-violet-900 transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al Inicio
        </Link>
        
        <div className="flex items-center gap-3.5 border-b border-slate-100 pb-5">
          <div className="w-11 h-11 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Condiciones del Servicio</h1>
            <p className="text-xs text-slate-500 mt-0.5">Última actualización: Septiembre 2026</p>
          </div>
        </div>

        <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">1. Objeto y Aceptación</h2>
            <p>
              Las presentes Condiciones del Servicio regulan el acceso, navegación y utilización de la plataforma AutoBirthday (en adelante, el &ldquo;Servicio&rdquo;). Al registrarte, crear una cuenta o utilizar cualquiera de las funcionalidades de AutoBirthday, manifiestas haber leído, entendido y aceptado vincularte expresamente a estas condiciones.
            </p>
            <p>
              Para utilizar el Servicio debes ser mayor de edad según la legislación aplicable en tu país de residencia (al menos 18 años o la mayoría de edad legal equivalente) y contar con plena capacidad jurídica para celebrar contratos vinculantes.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">2. Descripción del Servicio y Desvinculación con Terceros</h2>
            <p>
              AutoBirthday es una herramienta de productividad y software como servicio (SaaS) diseñada para ayudar a los usuarios a recordar fechas de cumpleaños y programar felicitaciones personalizadas que son enviadas a través de su propia cuenta de WhatsApp mediante protocolos de sincronización autorizados por el usuario.
            </p>
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-amber-900">
              <strong>Aviso legal sobre marcas de terceros:</strong> AutoBirthday es un desarrollo independiente. No está respaldado, patrocinado, asociado ni directamente vinculado a Meta Platforms, Inc., WhatsApp LLC, Google LLC, ni a ninguna de sus filiales. WhatsApp y sus logotipos son marcas registradas de WhatsApp LLC.
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">3. Uso Aceptable y Compromiso Anti-Spam</h2>
            <p>
              El usuario se compromete expresamente a utilizar AutoBirthday de forma responsable, ética y de estricta conformidad con la ley aplicable (incluyendo las normativas sobre comunicaciones electrónicas de la Unión Europea, la Ley CAN-SPAM de EE.UU. y las legislaciones de telecomunicaciones y protección al consumidor de España y los principales países de Latinoamérica).
            </p>
            <p>Queda expresamente prohibido:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-700">
              <li>Utilizar el Servicio para enviar comunicaciones no deseadas, masivas, comerciales no autorizadas o spam.</li>
              <li>Añadir números de teléfono de personas con las que no se mantenga una relación interpersonal, familiar o profesional legítima y previa.</li>
              <li>Remitir mensajes que contengan amenazas, contenido ilícito, acoso, difamación, engaño o material lesivo.</li>
              <li>Intentar eludir las medidas de seguridad técnicas o los límites de uso establecidos en la plataforma.</li>
            </ul>
            <p>
              El usuario es el único y exclusivo responsable del contenido de los mensajes que programa y envía, así como de la veracidad y licitud de los datos de contacto introducidos.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">4. Registro, Seguridad de la Cuenta y WhatsApp</h2>
            <p>
              Para acceder a las funcionalidades principales es necesario crear una cuenta protegida mediante credenciales de acceso. Eres responsable de mantener la confidencialidad de tu contraseña y del control sobre el dispositivo vinculado a través del código o código QR de WhatsApp.
            </p>
            <p>
              AutoBirthday no almacena tus conversaciones privadas de chat ni tiene acceso a tu historial general de mensajes. Únicamente se gestiona la sesión técnica necesaria para remitir la felicitación programada en la fecha indicada.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">5. Propiedad Intelectual</h2>
            <p>
              Todos los derechos de propiedad intelectual e industrial sobre la plataforma AutoBirthday, su código fuente, diseño gráfico, arquitectura de navegación, interfaces, textos y marcas comerciales pertenecen en exclusiva a sus titulares legítimos. Se concede al usuario una licencia de uso limitada, no exclusiva, revocable e intransferible para el uso de la plataforma conforme a estas condiciones.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">6. Disponibilidad, Modificaciones y Limitación de Responsabilidad</h2>
            <p>
              AutoBirthday se proporciona sobre una base &ldquo;tal cual&rdquo; (<em>as is</em>) y &ldquo;según disponibilidad&rdquo;. Aunque aplicamos las mejores prácticas de ingeniería para garantizar la máxima estabilidad y puntualidad en los envíos, no garantizamos que el servicio sea ininterrumpido o libre de errores derivados de fallos en redes de telecomunicaciones, servidores de terceros o modificaciones en la API de WhatsApp.
            </p>
            <p>
              En la medida permitida por la legislación aplicable, AutoBirthday no responderá por daños indirectos, pérdida de datos o lucro cesante derivados de la utilización o imposibilidad de utilización del Servicio.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">7. Cancelación y Baja</h2>
            <p>
              Puedes darte de baja en cualquier momento accediendo al panel de <strong>Ajustes &gt; Eliminar mi cuenta</strong>. La eliminación de la cuenta borra de manera definitiva e inmediata todos tus contactos, plantillas, historiales de envíos y sesiones vinculadas.
            </p>
            <p>
              AutoBirthday se reserva el derecho de suspender o revocar el acceso a aquellos usuarios que incumplan las presentes Condiciones o utilicen la herramienta con fines fraudulentos o abusivos.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">8. Legislación Aplicable y Resolución de Controversias</h2>
            <p>
              Estas condiciones se rigen por la legislación española y la normativa comunitaria europea. En caso de discrepancia o conflicto, las partes se someten a los juzgados y tribunales competentes conforme a la normativa de protección de los consumidores y usuarios correspondiente al domicilio del usuario.
            </p>
          </section>

          <section className="space-y-2 pt-2 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900">9. Contacto</h2>
            <p>
              Para cualquier consulta o notificación relativa a estas Condiciones del Servicio, puedes dirigirte a nuestro canal de soporte legal:
            </p>
            <p className="font-mono text-xs bg-slate-100 p-2.5 rounded-xl text-slate-800 inline-block">
              lucasjimeneznavarro@gmail.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

