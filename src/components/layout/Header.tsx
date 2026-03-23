import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/app/lib/supabase/server";
import type { Locale } from "@/app/lib/i18n/config";

import SearchButton from "@/components/layout/header/SearchButton";
import ThemeToggle from "@/components/layout/header/ThemeToggle";
import LanguageSwitcher from "@/components/layout/header/LanguageSwitcher";
import AuthMenu from "@/components/layout/header/AuthMenu";

export default async function Header({ locale }: { locale: Locale }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-18 sm:px-6 lg:px-8">
        {/* Left Section */}
        <div className="flex min-w-0 items-center gap-3 sm:gap-5 lg:gap-6">
          <Link href={`/${locale}`} className="shrink-0">
            <Image
              src="/images/brand/wakeup-logo.png"
              alt="WakeUp logo"
              width={120}
              height={26}
              priority
              className="h-8 w-auto sm:h-10"
            />
          </Link>

          {/* Desktop / Tablet Navigation */}
          <nav className="hidden items-center gap-1 text-sm font-medium sm:flex sm:gap-2 sm:text-base lg:gap-4">
            <Link
              href={`/${locale}/quiz`}
              className="rounded-full px-2 py-1 text-center transition hover:bg-[#DBEBF1] sm:px-3 sm:py-1.5"
            >
              Test
            </Link>

            <Link
              href={`/${locale}/products`}
              className="rounded-full px-2 py-1 text-center transition hover:bg-[#DBEBF1] sm:px-3 sm:py-1.5"
            >
              Products
            </Link>
          </nav>
        </div>

        {/* Right Section - Desktop / Tablet */}
        <div className="hidden shrink-0 items-center gap-1 sm:flex sm:gap-2">
          <SearchButton locale={locale} />
          <ThemeToggle />
          <LanguageSwitcher currentLocale={locale} />
          <AuthMenu locale={locale} userEmail={user?.email ?? null} />
        </div>

        {/* Right Section - Mobile */}
        <div className="flex items-center gap-2 sm:hidden">
          <SearchButton locale={locale} />
          <AuthMenu locale={locale} userEmail={user?.email ?? null} />

          <details className="relative">
            <summary className="flex cursor-pointer list-none items-center justify-center rounded-full p-2 transition hover:bg-[#DBEBF1] [&::-webkit-details-marker]:hidden">
              <span className="text-xl leading-none">☰</span>
            </summary>

            <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-black/10 bg-white p-3 shadow-lg">
              <nav className="flex flex-col gap-1">
                <Link
                  href={`/${locale}/quiz`}
                  className="rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-[#DBEBF1]"
                >
                  Test
                </Link>

                <Link
                  href={`/${locale}/products`}
                  className="rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-[#DBEBF1]"
                >
                  Products
                </Link>

                <div className="my-1 h-px bg-black/10" />

                <div className="rounded-xl px-3 py-2 transition hover:bg-[#DBEBF1]">
                  <LanguageSwitcher currentLocale={locale} />
                </div>

                <div className="rounded-xl px-3 py-2 transition hover:bg-[#DBEBF1]">
                  <ThemeToggle />
                </div>
              </nav>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
