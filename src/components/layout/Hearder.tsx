// src/components/layout/Header.tsx

/**
 * 역할: 전역 헤더(Server Component).
 * - 서버에서 Supabase 세션을 읽어 로그인 여부를 판단
 * - 왼쪽 로고(홈 링크), 오른쪽 유틸 버튼(검색/다크모드/언어/로그인)을 배치
 * - 로그인 상태면 대시보드 아이콘을 추가로 노출
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

  const isAuthed = Boolean(user);

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {/* Left: Logo -> Home */}
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-[#DBEBF1] transition"
        >
          <span className="text-base font-semibold tracking-tight text-black">
            WakeUp
          </span>
        </Link>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          {isAuthed && (
            <Link
              href={`/${locale}/dashboard`}
              className="inline-flex items-center justify-center rounded-full p-2 hover:bg-[#DBEBF1] transition"
              aria-label="Dashboard"
              title="Dashboard"
            >
              {/* 간단한 대시보드 아이콘 (SVG) */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                className="text-black"
              >
                <path
                  d="M4 13h7V4H4v9zm9 7h7V11h-7v9zM4 20h7v-5H4v5zm9-16v5h7V4h-7z"
                  fill="currentColor"
                />
              </svg>
            </Link>
          )}

          <SearchButton locale={locale} />
          <ThemeToggle />
          <LanguageSwitcher currentLocale={locale} />
          <AuthMenu locale={locale} userEmail={user?.email ?? null} />
        </div>
      </div>
    </header>
  );
}
