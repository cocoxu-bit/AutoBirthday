import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  MessageSquare, 
  Zap, 
  ShieldCheck, 
  Heart, 
  HelpCircle,
  Cake
} from 'lucide-react';
import { BirthdayWishGenerator } from '@/components/public/birthday-wish-generator';
import { WISH_SEO_PAGES, generateWishJsonLd } from '@/lib/seo/wishes-seo-data';

export const metadata: Metadata = {
  title: 'Generador de Felicitaciones de Cumpleaños con IA Gratis para WhatsApp | AutoBirthday',
  description: 'Crea felicitaciones de cumpleaños originales, divertidas o emotivas con inteligencia artificial. Gratis, sin registro previo y listas para copiar y enviar por WhatsApp.',
  keywords: [
    'generador felicitaciones cumpleaños ia',
    'felicitaciones de cumpleaños para whatsapp',
    'mensajes de cumpleaños personalizados gratis',
    'frases de cumpleaños con inteligencia artificial',
    'autobirthday felicitaciones'
  ],
  alternates: {
    canonical: 'https://autobirthday.com/felicitaciones',
  },
  openGraph: {
    title: 'Generador de Felicitaciones de Cumpleaños con IA Gratis | AutoBirthday',
    description: 'Escribe felicitaciones divertidas, emotivas o formales en segundos. Gratis y sin registro.',
    url: 'https://autobirthday.com/felicitaciones',
    siteName: 'AutoBirthday',
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Generador de Felicitaciones de Cumpleaños con IA Gratis para WhatsApp',
    description: 'Escribe felicitaciones divertidas, emotivas o formales en segundos con inteligencia artificial.',
  },
};

const HUB_FAQS = [
  {
    question: '¿Es realmente gratis este generador de felicitaciones?',
    answer: 'Sí, es 100% gratuito y no requiere crear ninguna cuenta ni introducir datos de pago para generar y copiar tantas felicitaciones como desees.',
  },
  {
    question: '¿Por qué las felicitaciones suenan más naturales que las de otras webs?',
    answer: 'Utilizamos modelos avanzados de IA afinados con pautas de lenguaje coloquial y natural de WhatsApp en español, evitando frases robóticas o clichés típicos como "en este día tan especial".',
  },
  {
    question: '¿Qué es AutoBirthday y cómo automatiza WhatsApp?',
    answer: 'AutoBirthday es una plataforma que sincroniza tu agenda de cumpleaños y envía automáticamente por WhatsApp felicitaciones personalizadas a tus amigos, familiares y grupos a la hora que tú elijas.',
  },
  {
    question: '¿Puedo enviar la felicitación generada directamente a WhatsApp?',
    answer: 'Sí, simplemente pulsa en "Copiar para WhatsApp" y pégala en la conversación o grupo de WhatsApp de la persona que cumple años.',
  },
];

export default function FelicitacionesHubPage() {
  const jsonLd = generateWishJsonLd(
    {
      slug: 'hub',
      title: 'Generador de Felicitaciones de Cumpleaños con IA',
      metaDescription: 'Crea felicitaciones de cumpleaños con inteligencia artificial para WhatsApp.',
      h1: 'Generador de Felicitaciones con IA',
      subtitle: '',
      relationship: 'amigo/a',
      tone: 'divertido',
      badge: '',
      targetAudience: '',
      keywords: [],
      examples: [],
      faqs: HUB_FAQS,
    },
    'https://autobirthday.com/felicitaciones'
  );

  const categories = Object.values(WISH_SEO_PAGES);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-purple-50/20 to-slate-50 text-slate-900 font-sans">
      
      {/* Schema.org JSON-LD Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 font-black text-slate-900 text-sm tracking-tight hover:opacity-85 transition-opacity">
            <span className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center text-sm shadow-sm">
              🎂
            </span>
            <span className="text-base font-extrabold">AutoBirthday</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 px-3 py-2 transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register?ref=hub_nav"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-sm transition-all"
            >
              Crear cuenta gratis
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section & Generator */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-12 text-center">
        
        {/* Title Header */}
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-violet-100 text-violet-800 text-xs font-bold tracking-wide border border-violet-200">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span>Herramienta Gratuita con Inteligencia Artificial</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight">
            Generador de Felicitaciones de Cumpleaños para WhatsApp
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Escribe dedicatorias auténticas, graciosas o emotivas en segundos. Sin registros ni clichés: personaliza el nombre, vínculo y tono para dejar boquiabierto al cumpleañero.
          </p>
        </div>

        {/* 3. The Interactive Generator */}
        <div className="pt-2">
          <BirthdayWishGenerator
            defaultRelationship="amigo/a"
            defaultTone="divertido"
            badgeText="Generador de Felicitaciones IA"
          />
        </div>

        {/* 4. Categorías Programáticas (Internal SEO Linking Grid) */}
        <section className="pt-12 text-left space-y-6">
          <div className="space-y-1 text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Plantillas e ideas según a quién quieras felicitar
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Accede a colecciones específicas optimizadas para cada tipo de relación:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => (
              <Link
                key={cat.slug}
                href={`/felicitaciones/${cat.slug}`}
                className="group p-5 bg-white rounded-3xl border border-slate-200 hover:border-violet-300 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-violet-700 bg-violet-50 px-2.5 py-0.5 rounded-full">
                    {cat.badge}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-violet-600 transition-colors">
                    {cat.h1}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
                    {cat.metaDescription}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-violet-600 group-hover:translate-x-0.5 transition-transform pt-2">
                  <span>Abrir generador específico</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 5. Ventajas / Por qué usar AutoBirthday */}
        <section className="pt-12 p-8 sm:p-10 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-8 text-left">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl font-black text-slate-900">
              ¿Por qué felicitar con nuestra IA?
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              Diseñado exclusivamente para sonar humano en WhatsApp, no como una felicitación robótica.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                ⚡
              </div>
              <h3 className="text-sm font-bold text-slate-900">0% clichés, 100% natural</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Olvídate del típico "te deseo lo mejor en este día tan especial". La IA genera mensajes espontáneos que parecen escritos por ti en un momento de inspiración.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                📱
              </div>
              <h3 className="text-sm font-bold text-slate-900">Formato exacto para WhatsApp</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Longitud calibrada entre 1 y 3 frases, emojis elegantes y estilo directo para que quede impecable en pantallas móviles.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
                🤖
              </div>
              <h3 className="text-sm font-bold text-slate-900">Personalización con anécdotas</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Añade cualquier detalle (su comida favorita, afición o broma interna) y la IA lo hilará de forma divertida en la felicitación.
              </p>
            </div>
          </div>
        </section>

        {/* 6. Preguntas Frecuentes (FAQ) */}
        <section className="pt-8 text-left space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h2 className="text-2xl font-black text-slate-900">Preguntas Frecuentes</h2>
            <p className="text-xs text-slate-500 font-medium">
              Todo lo que necesitas saber sobre el generador gratuito y AutoBirthday.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {HUB_FAQS.map((faq, idx) => (
              <div key={idx} className="p-5 bg-white rounded-2xl border border-slate-200/80 space-y-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                  <span>{faq.question}</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal pl-6">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 7. Bottom Conversion Banner */}
        <section className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-violet-950 text-white border border-violet-800/40 text-center space-y-5 relative overflow-hidden shadow-xl">
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              <span>Nunca más olvides un cumpleaños</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Automatiza tus felicitaciones por WhatsApp con AutoBirthday
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              Conecta tu WhatsApp en 1 minuto, sincroniza tus contactos y deja que nuestra inteligencia artificial se encargue de felicitar a todos tus amigos a la hora ideal.
            </p>

            <div className="pt-2">
              <Link
                href="/register?ref=hub_bottom"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all"
              >
                <span>Empezar gratis hoy</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* 8. Minimal Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2 font-bold text-slate-700">
            <span>🎂 AutoBirthday</span>
            <span>·</span>
            <span className="font-normal text-slate-400">Generador de felicitaciones con IA</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-slate-800 transition-colors">
              Privacidad
            </Link>
            <Link href="/terms" className="hover:text-slate-800 transition-colors">
              Términos
            </Link>
            <Link href="/register" className="font-bold text-violet-600 hover:text-violet-700 transition-colors">
              Crear cuenta gratis
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
