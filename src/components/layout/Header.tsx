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
          {/* Logo */}
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

          {/* Navigation */}
          <nav className="flex items-center gap-1 sm:gap-2 lg:gap-4 text-sm font-medium sm:text-base">
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

        {/* Right Section */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <SearchButton locale={locale} />
          <ThemeToggle />
          <LanguageSwitcher currentLocale={locale} />
          <AuthMenu locale={locale} userEmail={user?.email ?? null} />
        </div>
      </div>
    </header>
  );
}
