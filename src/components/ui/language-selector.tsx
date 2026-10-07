"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/context";
import { SUPPORTED_LOCALES, SupportedLocale } from "@/lib/i18n/config";
import { Globe, ChevronDown, Check } from "lucide-react";

interface LanguageSelectorProps {
  variant?: "glass" | "solid" | "minimal";
  className?: string;
  showText?: boolean;
}

export function LanguageSelector({
  variant = "glass",
  className = "",
  showText = true,
}: LanguageSelectorProps) {
  const { locale, setLocale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLocaleInfo = SUPPORTED_LOCALES[locale] || SUPPORTED_LOCALES.es;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const buttonStyles = {
    glass:
      "bg-white/80 hover:bg-white text-slate-700 border border-slate-200/80 shadow-xs backdrop-blur-md",
    solid:
      "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs",
    minimal:
      "bg-transparent hover:bg-slate-100/70 text-slate-700 border-transparent",
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 active:scale-[0.98] ${buttonStyles[variant]}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Cambiar idioma / Change language"
      >
        <span className="text-base leading-none">{currentLocaleInfo.flag}</span>
        {showText && (
          <span className="uppercase tracking-wide text-xs text-slate-600 font-bold hidden sm:inline">
            {currentLocaleInfo.code}
          </span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-violet-600" : ""
          }`}
        />
      </button>


      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-white/95 backdrop-blur-md shadow-xl shadow-slate-900/10 border border-slate-200/90 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Idioma / Language
          </div>
          {(Object.keys(SUPPORTED_LOCALES) as SupportedLocale[]).map((code) => {
            const info = SUPPORTED_LOCALES[code];
            const isSelected = locale === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setLocale(code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-left transition-colors ${
                  isSelected
                    ? "bg-violet-50/80 text-violet-800 font-bold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base leading-none">{info.flag}</span>
                  <span>{info.nativeName}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-violet-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
