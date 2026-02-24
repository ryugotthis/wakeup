import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/app/lib/i18n/config";

function detectLocale(header: string | null) {
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

  if (hasLocale) return NextResponse.next();

  const detected = detectLocale(req.headers.get("accept-language"));

  const url = req.nextUrl.clone();
  url.pathname = `/${detected}${pathname === "/" ? "" : pathname}`;

  return NextResponse.redirect(url);
}

/**
 * middleware 적용 범위
 * - api 제외
 * - next static 제외
 * - assets 제외
 */
export const config = {
  matcher: [
    /*
      제외:
      - /api
      - /_next
      - /images
      - favicon
    */
    "/((?!api|_next|images|favicon.ico).*)",
  ],
};
