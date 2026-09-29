import Link from 'next/link';
import { ArrowLeft, Shield, Lock, EyeOff } from 'lucide-react';

export const metadata = {
  title: 'Política de Privacidad | AutoBirthday',
  description: 'Política de privacidad y protección de datos personales de AutoBirthday conforme a RGPD, CCPA y normativas internacionales.',
};

export default function PrivacyPolicyPage() {
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
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Política de Privacidad</h1>
            <p className="text-xs text-slate-500 mt-0.5">Última actualización: Septiembre 2026</p>
          </div>
        </div>

        <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">1. Responsable del Tratamiento</h2>
            <p>
              En cumplimiento del Reglamento General de Protección de Datos (RGPD UE 2016/679), la Ley Orgánica 3/2018 (LOPDGDD de España), la California Consumer Privacy Act (CCPA / CPRA de EE.UU.) y las legislaciones vigentes de protección de datos en los principales países hispanohablantes (incluyendo México, Argentina, Colombia y Chile), se informa que el responsable del tratamiento de los datos recabados en AutoBirthday es el titular de la plataforma, accesible a través del correo electrónico:
            </p>
            <p className="font-mono text-xs bg-slate-100 p-2.5 rounded-xl text-slate-800 inline-block">
              lucasjimeneznavarro@gmail.com
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">2. Datos Personales que Recopilamos</h2>
            <p>
              AutoBirthday aplica el principio de minimización de datos recabando exclusivamente la información estrictamente necesaria para prestar el servicio:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-700">
              <li><strong>Datos de tu cuenta de usuario:</strong> Nombre o alias visible, dirección de correo electrónico, contraseña cifrada mediante hash criptográfico y preferencias de idioma y zona horaria.</li>
              <li><strong>Datos de tu agenda de cumpleaños:</strong> Nombre o apodo del cumpleañero, fecha de cumpleaños (día, mes y año si es proporcionado), número de teléfono móvil de WhatsApp, grupo de WhatsApp de destino (opcional) y notas personales de felicitación configuradas por ti.</li>
              <li><strong>Datos técnicos y de sesión:</strong> Dirección IP anonimizada, registros técnicos de envío (hora de ejecución y estado de entrega), cookies técnicas estrictamente necesarias para mantener tu sesión activa y credenciales de vinculación cifradas de WhatsApp.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">3. Finalidades y Bases Legales del Tratamiento</h2>
            <p>Tratamos tus datos personales sobre las siguientes bases jurídicas:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
              <li>
                <strong>Ejecución del contrato (Art. 6.1.b RGPD):</strong> Prestar las funcionalidades esenciales de AutoBirthday, registrar los recordatorios, avisarte para aprobar las felicitaciones y enviar los mensajes que hayas programado a través de tu cuenta vinculada.
              </li>
              <li>
                <strong>Consentimiento explícito (Art. 6.1.a RGPD):</strong> Al vincular voluntariamente tu número de teléfono con WhatsApp para la emisión de felicitaciones.
              </li>
              <li>
                <strong>Interés legítimo (Art. 6.1.f RGPD):</strong> Garantizar la seguridad técnica de la plataforma, prevenir accesos no autorizados y fraudes telemáticos.
              </li>
            </ul>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-xs text-slate-700 mt-2">
              <strong>Nota sobre la agenda de contactos de terceros:</strong> Cuando introduces las fechas de cumpleaños de tus amigos, familiares o clientes, actúas en calidad de responsable de dichos datos en el marco de tu esfera interpersonal o profesional legítima. AutoBirthday actúa como mero encargado técnico para ejecutar la programación y envío del mensaje bajo tus directrices exclusivas.
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">4. Compromiso de No Venta de Datos (CCPA / CPRA)</h2>
            <p>
              <strong>Bajo ninguna circunstancia vendemos, alquilamos, cedemos ni comercializamos tus datos personales ni los de tus contactos a terceros, empresas de publicidad o redes comerciales.</strong>
            </p>
            <p>
              AutoBirthday no utiliza tu información de contactos para fines publicitarios propios ni ajenos. Todos los datos permanecen privados y protegidos en tu cuenta.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">5. Medidas de Seguridad y Cifrado</h2>
            <p>
              Implementamos rigurosas medidas de seguridad técnicas y organizativas para proteger tus datos contra pérdidas, accesos indebidos o divulgación:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-700">
              <li>Toda la comunicación entre tu navegador y nuestros servidores viaja cifrada mediante HTTPS con protocolos TLS 1.3.</li>
              <li>Bases de datos protegidas en centros de datos de Google Cloud Platform / Firebase bajo estándares internacionales ISO/IEC 27001 y SOC 2.</li>
              <li>Instancias de vinculación de WhatsApp aisladas por contenedor sin acceso a tu histórico de conversaciones ni lectura de chats privados ajenos a la felicitación.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">6. Conservación y Eliminación Definitiva</h2>
            <p>
              Conservamos tus datos únicamente mientras mantengas activa tu cuenta en AutoBirthday. 
            </p>
            <p>
              Tienes el control total: en cualquier momento puedes acceder a <strong>Ajustes &gt; Eliminar mi cuenta</strong> para borrar instantánea, completa e irreversiblemente todos tus contactos, plantillas, historiales de envíos y sesiones vinculadas de nuestros servidores.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">7. Derechos del Usuario (ARCO / RGPD / CCPA)</h2>
            <p>
              Conforme a la normativa europea (RGPD), estadounidense (CCPA/CPRA) y las leyes de privacidad aplicables en Latinoamérica (como los derechos ARCO: Acceso, Rectificación, Cancelación y Oposición), dispones de los siguientes derechos:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-700">
              <li><strong>Acceso:</strong> Conocer qué datos personales tuyos están siendo tratados.</li>
              <li><strong>Rectificación:</strong> Modificar datos inexactos o incompletos directamente desde la interfaz.</li>
              <li><strong>Supresión (&ldquo;Derecho al olvido&rdquo;):</strong> Solicitar el borrado íntegro de tus datos.</li>
              <li><strong>Oposición y Limitación:</strong> Oponerte al tratamiento o solicitar la limitación de determinadas operaciones.</li>
              <li><strong>Portabilidad:</strong> Solicitar una copia de tus datos en un formato digital estructurado y legible.</li>
            </ul>
            <p>
              Para ejercer cualquiera de estos derechos, basta con enviar un correo electrónico a <strong>lucasjimeneznavarro@gmail.com</strong> indicando tu solicitud. Responderemos en un plazo máximo de 30 días naturales sin coste alguno.
            </p>
            <p className="text-xs text-slate-500">
              Asimismo, si consideras que tus derechos han sido vulnerados, tienes derecho a presentar una reclamación ante la autoridad de protección de datos competente (en España, la Agencia Española de Protección de Datos - AEPD; en México, el INAI; o la autoridad equivalente en tu país de residencia).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">8. Política de Cookies</h2>
            <p>
              AutoBirthday utiliza únicamente <strong>cookies técnicas estrictamente necesarias</strong> para gestionar la autenticación segura y recordar tu preferencia de idioma. No utilizamos cookies de terceros, píxeles de seguimiento publicitario ni herramientas de rastreo entre sitios web.
            </p>
          </section>

          <section className="space-y-2 pt-2 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900">9. Modificaciones y Dudas</h2>
            <p>
              Podemos actualizar periódicamente esta Política de Privacidad para reflejar cambios legales o técnicos. Notificaremos cualquier actualización relevante a través de la propia plataforma. Para cualquier duda:
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

