import "server-only";
import type { Locale } from "@/app/lib/i18n/config";

export const dictionaries = {
  en: () => import("./dictionaries/en").then((m) => m.default),
  ko: () => import("./dictionaries/ko").then((m) => m.default),
  fr: () => import("./dictionaries/fr").then((m) => m.default),
} as const;

export async function getDictionary(locale: Locale) {
  const loader = dictionaries[locale] ?? dictionaries.en;
  return loader();
}
