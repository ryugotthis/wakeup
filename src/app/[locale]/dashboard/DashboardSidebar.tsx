// src/app/[locale]/dashboard/DashboardSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type Locale = "ko" | "en" | "fr";

function t(locale: Locale, ko: string, en: string, fr: string) {
  return locale === "ko" ? ko : locale === "fr" ? fr : en;
}

export default function DashboardSidebar({ locale }: { locale: Locale }) {
  const pathname = usePathname();

  const items = [
    {
      key: "saved",
      href: `/${locale}/dashboard`,
      label: t(locale, "SKTI 결과", "SKTI results", "Résultats SKTI"),
    },
    {
      key: "bookmarks",
      href: `/${locale}/dashboard/bookmarks`,
      label: t(locale, "찜 목록", "Bookmarks", "favoris"),
    },
    {
      key: "products",
      href: `/${locale}/products`,
      label: t(locale, "제품", "Products", "Produits"),
    },
    {
      key: "settings",
      href: `/${locale}/dashboard/settings`,
      label: t(locale, "설정", "Settings", "Paramètres"),
    },
    {
      key: "account",
      href: `/${locale}/dashboard/account`,
      label: t(locale, "계정", "Account", "Compte"),
    },
  ];

  // ✅ active 판정:
  // - /ko/dashboard => saved
  // - /ko/dashboard/xxx => 그 메뉴
  // - /ko/products => products
  const isActive = (href: string) => {
    if (href === `/${locale}/dashboard`) {
      return pathname === href; // 기본 값은 정확히 /dashboard 일 때만
    }
    return pathname?.startsWith(href);
  };

  return (
    <aside className="rounded-3xl border border-black/10 bg-white p-4 sticky top-6 h-[calc(100vh-3rem)]">
      <div className="px-2 py-2">
        <p className="text-xs font-medium text-black/40">WakeUp</p>
        <h2 className="mt-1 text-lg font-semibold text-black">
          {t(locale, "대시보드", "Dashboard", "Tableau de bord")}
        </h2>
      </div>

      <nav className="mt-4 space-y-1">
        {items.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex items-center justify-between rounded-2xl px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-black text-white"
                  : "text-black/70 hover:bg-black/5",
              )}
            >
              <span className="truncate">{item.label}</span>
              <span
                className={cn(
                  "text-xs",
                  active ? "text-white/70" : "text-black/30",
                )}
              >
                →
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="my-4 h-px bg-black/10" />

      <div className="rounded-2xl bg-black/5 p-3">
        <p className="text-xs text-black/50">
          {t(
            locale,
            "피부는 변해요. 주기적으로 다시 테스트해보세요.",
            "Skin changes. Retake regularly.",
            "La peau change. Refaites le test régulièrement.",
          )}
        </p>

        <Link
          href={`/${locale}/quiz`}
          className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
        >
          {t(locale, "테스트 다시하기", "Retake test", "Refaire le test")}
        </Link>
      </div>
    </aside>
  );
}
