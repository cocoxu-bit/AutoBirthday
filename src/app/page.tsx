"use client";

import Link from "next/link";
import Image from "next/image";
import { PageTrafficTracker } from "@/components/analytics/page-traffic-tracker";
import { useTranslation } from "@/lib/i18n/context";
import { LanguageSelector } from "@/components/ui/language-selector";
import {
  Cake,
  MessageCircle,
  Sparkles,
  Zap,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  const { dict } = useTranslation();
  const landing = dict.landing;

  return (
    <div className="min-h-screen bg-gradient-festive w-full max-w-full overflow-x-hidden">
      <PageTrafficTracker path="/" title="Landing Principal AutoBirthday" category="core" />
      
      {/* Header */}
      <header className="glass-strong sticky top-0 z-50 border-b border-white/20 w-full overflow-hidden">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 shrink-0">
            <Image 
              src="/logo.png" 
              alt="AutoBirthday" 
              width={32} 
              height={32} 
              className="object-contain sm:w-9 sm:h-9" 
              priority 
            />
            <span className="font-black text-lg sm:text-xl bg-gradient-to-r from-violet-700 to-indigo-700 bg-clip-text text-transparent">
              AutoBirthday
            </span>
          </div>

          {/* Action buttons & Language */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <LanguageSelector variant="glass" />
            <Link
              href="/login"
              className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-violet-600 transition-colors px-2 sm:px-3 py-1.5 whitespace-nowrap"
            >
              {landing.header.login}
            </Link>
            <Link
              href="/register"
              className="text-xs sm:text-sm font-bold text-white bg-gradient-violet px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-xl shadow-md shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 whitespace-nowrap"
            >
              {landing.header.startNow}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-12 sm:pt-20 pb-16 sm:pb-24 text-center relative overflow-hidden">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[280px] sm:w-[500px] h-[280px] sm:h-[500px] bg-violet-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-full">
          <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-medium mb-6 max-w-full">
            <Sparkles className="w-4 h-4 text-violet-600 shrink-0" />
            <span className="truncate">{landing.hero.badge}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight max-w-3xl mx-auto px-2 break-words">
            {landing.hero.titlePart1}{" "}
            <span className="text-[#285953]">
              {landing.hero.titleHighlight}
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-600 mt-5 max-w-2xl mx-auto leading-relaxed px-2">
            {landing.hero.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-8 sm:mt-10 w-full max-w-xs sm:max-w-none mx-auto">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-violet text-white font-semibold px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-base sm:text-lg"
            >
              {landing.hero.startNowCta}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-xs sm:text-sm text-slate-500">
              {landing.hero.readyInMinutes}
            </p>
          </div>
        </div>
      </section>

      {/* Features: 3 Cards */}
      <section className="max-w-6xl mx-auto px-4 pb-16 sm:pb-24 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {[
            {
              icon: MessageCircle,
              title: landing.features.f1Title,
              description: landing.features.f1Desc,
              color: "bg-emerald-100 text-emerald-700",
            },
            {
              icon: Zap,
              title: landing.features.f2Title,
              description: landing.features.f2Desc,
              color: "bg-amber-100 text-amber-700",
            },
            {
              icon: Cake,
              title: landing.features.f3Title,
              description: landing.features.f3Desc,
              color: "bg-teal-100 text-[#285953]",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="glass-strong rounded-2xl p-5 sm:p-6 hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300"
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
      <section className="max-w-6xl mx-auto px-4 pb-16 sm:pb-24 overflow-hidden">
        <div className="bg-gradient-violet rounded-3xl p-6 sm:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
            <div className="absolute top-4 left-4 text-3xl sm:text-4xl">🎂</div>
            <div className="absolute top-8 right-6 text-2xl sm:text-3xl">🎉</div>
            <div className="absolute bottom-6 left-1/4 text-4xl sm:text-5xl">🎈</div>
            <div className="absolute bottom-4 right-8 text-3xl sm:text-4xl">🥳</div>
          </div>
          <div className="relative z-10 max-w-full">
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-6 sm:mb-8 px-2">
              {landing.cta.title}
            </h2>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-white text-violet-700 font-semibold px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-base sm:text-lg"
            >
              {landing.cta.button}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-violet-100 py-6 sm:py-8 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs sm:text-sm text-slate-500">
          <p>
            {landing.footer.copyright.replace("{year}", new Date().getFullYear().toString())}
          </p>
        </div>
      </footer>
    </div>
  );
}
