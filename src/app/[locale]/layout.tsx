/**
 * 역할: 전역 헤더(Server Component).
 * - 로고 + 주요 네비(Test / Products)
 * - 우측에 검색/다크모드/언어/로그인 메뉴 배치
 * - 로그인 상태는 서버에서 세션을 읽어 AuthMenu에 전달
 */

import Link from "next/link";
import { createClient } from "@/app/lib/supabase/server";
import type { Locale } from "@/app/lib/i18n/config";

import SearchButton from "@/components/header/SearchButton";
import ThemeToggle from "@/components/header/ThemeToggle";
import LanguageSwitcher from "@/components/header/LanguageSwitcher";
import AuthMenu from "@/components/header/AuthMenu";

export default async function Header({ locale }: { locale: Locale }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        {/* Left Section */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link
            href={`/${locale}`}
            className="text-lg font-semibold tracking-tight text-black hover:opacity-80 transition"
          >
            WakeUp
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link
              href={`/${locale}/quiz`}
              className="px-3 py-1.5 rounded-full hover:bg-[#DBEBF1] transition"
            >
              Test
            </Link>

            <Link
              href={`/${locale}/products`}
              className="px-3 py-1.5 rounded-full hover:bg-[#DBEBF1] transition"
            >
              Products
            </Link>
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          <SearchButton locale={locale} />
          <ThemeToggle />
          <LanguageSwitcher currentLocale={locale} />
          <AuthMenu locale={locale} userEmail={user?.email ?? null} />
        </div>
      </div>
    </header>
  );
}
