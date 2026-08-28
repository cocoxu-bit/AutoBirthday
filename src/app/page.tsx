import Link from "next/link";
import Image from "next/image";
import {
  Cake,
  MessageCircle,
  Sparkles,
  Calendar,
  Zap,
  Shield,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-festive">
      {/* Header */}
      <header className="glass-strong sticky top-0 z-50 border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="AutoBirthday" width={36} height={36} className="object-contain" priority />
            <span className="font-black text-xl bg-gradient-to-r from-violet-700 to-indigo-700 bg-clip-text text-transparent">
              AutoBirthday
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-violet-600 transition-colors px-4 py-2"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold text-white bg-gradient-violet px-5 py-2.5 rounded-xl shadow-md shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              Empezar Gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-24 text-center relative">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-violet-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            100% Gratis · Con IA
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight max-w-3xl mx-auto">
            Nunca más olvides un{" "}
            <span className="bg-gradient-birthday bg-clip-text text-transparent">
              cumpleaños
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 mt-6 max-w-2xl mx-auto leading-relaxed">
            Conecta tu WhatsApp, añade tus contactos y deja que la IA genere y
            envíe felicitaciones personalizadas{" "}
            <strong>automáticamente</strong>.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-gradient-violet text-white font-semibold px-8 py-4 rounded-2xl shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-lg"
            >
              Empezar Gratis
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-sm text-slate-500">
              Sin tarjeta de crédito · Setup en 2 minutos
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: MessageCircle,
              title: "WhatsApp Personal",
              description:
                "Conecta tu propio WhatsApp escaneando un QR. Los mensajes se envían desde tu número, como si los escribieras tú.",
              color: "bg-emerald-100 text-emerald-600",
            },
            {
              icon: Sparkles,
              title: "IA Personalizada",
              description:
                "Gemini genera felicitaciones únicas basadas en tu relación, tono y anécdotas con cada persona.",
              color: "bg-violet-100 text-violet-600",
            },
            {
              icon: Calendar,
              title: "Totalmente Automático",
              description:
                "Configura una vez y olvídate. El sistema escanea cumpleaños cada día y envía en el horario que elijas.",
              color: "bg-amber-100 text-amber-600",
            },
            {
              icon: Zap,
              title: "Aprobación por WhatsApp",
              description:
                "¿Prefieres revisar antes de enviar? Te avisamos por WhatsApp y apruebas con un simple SÍ.",
              color: "bg-pink-100 text-pink-600",
            },
            {
              icon: Shield,
              title: "Privado y Seguro",
              description:
                "Tus datos y contactos están protegidos. Tu sesión de WhatsApp solo la controlas tú.",
              color: "bg-blue-100 text-blue-600",
            },
            {
              icon: Cake,
              title: "Plantillas & Custom",
              description:
                "Usa plantillas con variables, mensajes manuales o deja que la IA decida. Tú eliges por cada contacto.",
              color: "bg-rose-100 text-rose-600",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="glass-strong rounded-2xl p-6 hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-1 transition-all duration-300"
            >
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${feature.color} mb-4`}
              >
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 pb-24">
        <div className="bg-gradient-violet rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-8 text-4xl">🎂</div>
            <div className="absolute top-12 right-16 text-3xl">🎉</div>
            <div className="absolute bottom-8 left-1/4 text-5xl">🎈</div>
            <div className="absolute bottom-4 right-8 text-4xl">🥳</div>
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              ¿Listo para no olvidar ningún cumpleaños?
            </h2>
            <p className="text-violet-200 text-lg mb-8 max-w-xl mx-auto">
              Crea tu cuenta en segundos y configura tu primer contacto.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-violet-700 font-semibold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-lg"
            >
              Crear Cuenta Gratis
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-violet-100 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-slate-500">
          <p>
            © {new Date().getFullYear()} AutoBirthday. Hecho con ❤️ para que
            nunca olvides un cumpleaños.
          </p>
        </div>
      </footer>
    </div>
  );
}
