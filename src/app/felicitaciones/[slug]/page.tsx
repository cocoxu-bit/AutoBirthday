import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  Sparkles, 
  ArrowRight, 
  ChevronRight, 
  HelpCircle, 
  Copy, 
  Check, 
  Zap, 
  MessageSquare,
  Cake,
  Quote
} from 'lucide-react';
import { BirthdayWishGenerator } from '@/components/public/birthday-wish-generator';
import { CopyWishCard } from '@/components/public/copy-wish-card';
import { 
  WISH_SEO_PAGES, 
  getWishSeoConfig, 
  getAllWishSlugs, 
  generateWishJsonLd 
} from '@/lib/seo/wishes-seo-data';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllWishSlugs();
  return slugs.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const config = getWishSeoConfig(slug);

  if (!config) {
    return {
      title: 'Felicitaciones de Cumpleaños | AutoBirthday',
    };
  }

  const canonicalUrl = `https://autobirthday.com/felicitaciones/${config.slug}`;

  return {
    title: config.title,
    description: config.metaDescription,
    keywords: config.keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: config.title,
      description: config.metaDescription,
      url: canonicalUrl,
      siteName: 'AutoBirthday',
      locale: 'es_ES',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: config.title,
      description: config.metaDescription,
    },
  };
}

export default async function FelicitacionesSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const config = getWishSeoConfig(slug);

  if (!config) {
    notFound();
  }

  const canonicalUrl = `https://autobirthday.com/felicitaciones/${config.slug}`;
  const jsonLd = generateWishJsonLd(config, canonicalUrl);

  // Other categories for internal linking
  const otherCategories = Object.values(WISH_SEO_PAGES).filter(c => c.slug !== config.slug).slice(0, 4);

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
              href="/felicitaciones"
              className="hidden sm:inline-block text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 transition-colors"
            >
              Todas las categorías
            </Link>
            <Link
              href={`/register?ref=seo_${config.slug}`}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-sm transition-all"
            >
              Crear cuenta gratis
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Main Content Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-14 space-y-12 text-center">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-slate-900 transition-colors">
            Inicio
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link href="/felicitaciones" className="hover:text-slate-900 transition-colors">
            Felicitaciones
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-violet-700 font-bold truncate max-w-[200px] sm:max-w-none">
            {config.badge}
          </span>
        </nav>

        {/* Hero Title & Context */}
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-violet-100 text-violet-800 text-xs font-bold tracking-wide border border-violet-200">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span>{config.badge}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-tight">
            {config.h1}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            {config.subtitle}
          </p>
        </div>

        {/* 3. Pre-configured Generator Component */}
        <div className="pt-2">
          <BirthdayWishGenerator
            defaultRelationship={config.relationship}
            defaultTone={config.tone}
            badgeText={config.badge}
          />
        </div>

        {/* 4. Ejemplos de Felicitaciones Listos para Copiar (Rich Content) */}
        {config.examples && config.examples.length > 0 && (
          <section className="pt-8 text-left space-y-5">
            <div className="space-y-1 text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Frases de inspiración para {config.badge.toLowerCase()}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Si tienes prisa, también puedes inspirarte o copiar directamente estas ideas redactadas:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {config.examples.map((item, idx) => (
                <CopyWishCard
                  key={idx}
                  label={item.label}
                  text={item.text}
                />
              ))}
            </div>
          </section>
        )}

        {/* 5. Preguntas Frecuentes Específicas del Slug */}
        {config.faqs && config.faqs.length > 0 && (
          <section className="pt-8 text-left space-y-5">
            <div className="space-y-1 text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Consejos y preguntas frecuentes
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Pautas para acertar con tu felicitación en WhatsApp.
              </p>
            </div>

            <div className="space-y-3">
              {config.faqs.map((faq, idx) => (
                <div key={idx} className="p-5 bg-white rounded-2xl border border-slate-200/80 space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                    <span>{faq.question}</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal pl-6">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6. Enlaces a Otras Categorías (Internal Links) */}
        {otherCategories.length > 0 && (
          <section className="pt-8 text-left space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              Otras colecciones de felicitaciones
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {otherCategories.map(cat => (
                <Link
                  key={cat.slug}
                  href={`/felicitaciones/${cat.slug}`}
                  className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-violet-300 hover:shadow-xs transition-all flex items-center justify-between group"
                >
                  <div>
                    <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider block">
                      {cat.badge}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-violet-600 transition-colors">
                      {cat.h1}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 7. Bottom Conversion Banner */}
        <section className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-violet-950 text-white border border-violet-800/40 text-center space-y-4 relative overflow-hidden shadow-xl">
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-xl mx-auto space-y-3">
            <h2 className="text-2xl font-black text-white">
              ¿Quieres no preocuparte nunca más de olvidar este cumpleaños?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              AutoBirthday felicita automáticamente por ti en WhatsApp con el mensaje ideal. Conexión en 60 segundos y 100% gratuito.
            </p>
            <div className="pt-2">
              <Link
                href={`/register?ref=seo_bottom_${config.slug}`}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all"
              >
                <span>Crear mi cuenta gratis</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* 8. Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2 font-bold text-slate-700">
            <span>🎂 AutoBirthday</span>
            <span>·</span>
            <span className="font-normal text-slate-400">{config.badge}</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/felicitaciones" className="hover:text-slate-800 transition-colors">
              Todas las categorías
            </Link>
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
