/**
 * 역할: 서버 컴포넌트에서 사용할 다국어(Dictionary) 로더를 제공한다.
 * - locale 값(en | ko | fr)에 따라 해당 언어의 dictionary 파일을 동적으로 import
 * - server-only를 통해 클라이언트 번들에 포함되지 않도록 제한
 * - getDictionary(locale)를 호출하면 해당 언어의 번역 객체를 반환
 * - 지원하지 않는 locale이 들어올 경우 기본값(en)으로 fallback 처리
 */

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
