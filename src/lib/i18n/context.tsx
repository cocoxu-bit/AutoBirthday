'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SupportedLocale, DEFAULT_LOCALE, SUPPORTED_LOCALES } from './config';
import { getDictionary, Dictionary } from './dictionaries';

interface LanguageContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  dict: Dictionary;
  t: (path: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
  initialLocale?: SupportedLocale;
}

export function LanguageProvider({ children, initialLocale = DEFAULT_LOCALE }: LanguageProviderProps) {
  const [locale, setLocaleState] = useState<SupportedLocale>(initialLocale);

  // Sync if initialLocale changes from server
  useEffect(() => {
    if (initialLocale && SUPPORTED_LOCALES[initialLocale]) {
      setLocaleState(initialLocale);
    }
  }, [initialLocale]);

  // Read cookie on mount if not provided from server
  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]*)/);
    if (match && match[1]) {
      const savedLocale = match[1] as SupportedLocale;
      if (SUPPORTED_LOCALES[savedLocale]) {
        setLocaleState(savedLocale);
      }
    }
  }, []);

  const setLocale = (newLocale: SupportedLocale) => {
    if (!SUPPORTED_LOCALES[newLocale]) return;
    setLocaleState(newLocale);
    // Persist in cookie for 1 year
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
  };

  const dict = getDictionary(locale);

  // Helper to access nested keys like t("nav.dashboard") or fallback to es
  const t = (path: string): string => {
    const keys = path.split('.');
    let current: any = dict;
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to Spanish dictionary
        let fallback: any = getDictionary(DEFAULT_LOCALE);
        for (const fbKey of keys) {
          if (fallback && typeof fallback === 'object' && fbKey in fallback) {
            fallback = fallback[fbKey];
          } else {
            return path;
          }
        }
        return typeof fallback === 'string' ? fallback : path;
      }
    }
    return typeof current === 'string' ? current : path;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, dict, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
