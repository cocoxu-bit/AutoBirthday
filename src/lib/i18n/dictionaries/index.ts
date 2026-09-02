import { SupportedLocale, DEFAULT_LOCALE } from "../config";
import { es, Dictionary } from "./es";
import { en } from "./en";
import { pt } from "./pt";
import { de } from "./de";

export const dictionaries: Record<SupportedLocale, Dictionary> = {
  es,
  en,
  pt,
  de,
};

export function getDictionary(locale: SupportedLocale): Dictionary {
  return dictionaries[locale] || dictionaries[DEFAULT_LOCALE];
}

export type { Dictionary };
