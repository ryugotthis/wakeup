// src/components/header/LanguageSwitcher.tsx
"use client";

/**
 * 역할: 언어 전환(Client).
 * - 현재 경로에서 첫 세그먼트(locale)만 교체해서 이동
 */

import { usePathname, useRouter } from "next/navigation";
import { SUPPORTED_LOCALES, type Locale } from "@/app/lib/i18n/config";

export default function LanguageSwitcher({
  currentLocale,
}: {
  currentLocale: Locale;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const change = (nextLocale: Locale) => {
    // pathname: /ko/xxx -> /en/xxx
    const parts = pathname.split("/");
    parts[1] = nextLocale;
    router.push(parts.join("/"));
  };

  return (
    <div className="flex items-center rounded-full border border-black/10 bg-white px-2 py-1">
      {SUPPORTED_LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => change(l)}
          className={[
            "px-2 py-1 text-xs rounded-full transition",
            l === currentLocale
              ? "bg-[#DBEBF1] text-black"
              : "text-black/70 hover:bg-[#DBEBF1]",
          ].join(" ")}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
