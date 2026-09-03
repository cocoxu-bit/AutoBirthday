import { cookies, headers } from 'next/headers';
import { SupportedLocale, DEFAULT_LOCALE, SUPPORTED_LOCALES, matchLocaleFromHeader } from './config';
import { getDictionary, Dictionary } from './dictionaries';

/**
 * Server-side helper to detect the current user locale based on:
 * 1. Explicit cookie 'NEXT_LOCALE'
 * 2. Header 'accept-language'
 * 3. Default fallback 'es'
 */
export async function getServerLocale(): Promise<SupportedLocale> {
  try {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value as SupportedLocale;

    if (cookieLocale && SUPPORTED_LOCALES[cookieLocale]) {
      return cookieLocale;
    }

    // If cookie is absent, check if user has a stored locale in their profile
    const sessionCookie = cookieStore.get('__session')?.value;
    if (sessionCookie) {
      try {
        const { adminAuth, adminDb } = await import('@/lib/firebase/admin');
        const decoded = await adminAuth.verifySessionCookie(sessionCookie, false);
        if (decoded?.uid) {
          const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
          const userLocale = userDoc.data()?.locale as SupportedLocale;
          if (userLocale && SUPPORTED_LOCALES[userLocale]) {
            return userLocale;
          }
        }
      } catch {}
    }

    const headerStore = await headers();
    const acceptLanguage = headerStore.get('accept-language');
    return matchLocaleFromHeader(acceptLanguage);
  } catch {
    return DEFAULT_LOCALE;
  }
}

/**
 * Server-side helper to get translations directly in server actions or server components.
 */
export async function getServerTranslations(): Promise<{
  locale: SupportedLocale;
  dict: Dictionary;
  t: (path: string) => string;
}> {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

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

  return { locale, dict, t };
}
