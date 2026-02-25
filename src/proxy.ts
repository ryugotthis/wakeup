import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type Locale,
} from "@/app/lib/i18n/config";

function detectLocale(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;

  const lower = header.toLowerCase();

  if (lower.includes("ko")) return "ko";
  if (lower.includes("fr")) return "fr";
  if (lower.includes("en")) return "en";

  return DEFAULT_LOCALE;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const hasLocale = SUPPORTED_LOCALES.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );

  // ✅ 이미 locale prefix가 있으면: 통과 + locale 쿠키만 심기
  if (hasLocale) {
    const seg = pathname.split("/")[1] as Locale; // /ko/... 에서 "ko"
    const res = NextResponse.next();
    res.cookies.set("locale", seg ?? DEFAULT_LOCALE, { path: "/" });
    return res;
  }

  // ✅ 없으면 감지해서 redirect + 쿠키 심기
  const detected = detectLocale(req.headers.get("accept-language"));

  const url = req.nextUrl.clone();
  url.pathname = `/${detected}${pathname === "/" ? "" : pathname}`;

  const res = NextResponse.redirect(url);
  res.cookies.set("locale", detected, { path: "/" });
  return res;
}

export const config = {
  matcher: ["/((?!api|_next|images|favicon.ico).*)"],
};
