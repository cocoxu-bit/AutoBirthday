export type SupportedLocale = 'es' | 'en' | 'pt' | 'de';

export interface LocaleInfo {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LOCALES: Record<SupportedLocale, LocaleInfo> = {
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
  },
  pt: {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇧🇷',
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
  },
};

export const DEFAULT_LOCALE: SupportedLocale = 'es';

/**
 * Parses an Accept-Language header and returns the best matching SupportedLocale.
 * Defaults to 'es' if no match is found.
 */
export function matchLocaleFromHeader(acceptLanguage?: string | null): SupportedLocale {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, q] = lang.trim().split(';q=');
      return {
        code: code.toLowerCase(),
        prefix: code.toLowerCase().split('-')[0],
        weight: q ? parseFloat(q) : 1.0,
      };
    })
    .sort((a, b) => b.weight - a.weight);

  for (const item of languages) {
    if (item.prefix === 'es') return 'es';
    if (item.prefix === 'en') return 'en';
    if (item.prefix === 'pt') return 'pt';
    if (item.prefix === 'de') return 'de';
  }

  return DEFAULT_LOCALE;
}
