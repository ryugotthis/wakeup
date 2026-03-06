"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type RouteLocale = "ko" | "en" | "fr";
type SkinTypeCode = "DS" | "OB" | "HS" | "CC" | "SC";

const SKTI: SkinTypeCode[] = ["DS", "OB", "HS", "CC", "SC"];

const SKTI_LABEL: Record<SkinTypeCode, { en: string; ko: string; fr: string }> =
  {
    DS: { en: "Dewy Seeker", ko: "윤광 추구형", fr: "Chercheur d’éclat" },
    OB: { en: "Oil Balancer", ko: "유분 밸런서", fr: "Équilibreur de sébum" },
    HS: {
      en: "Hydration Stabilizer",
      ko: "수분 안정형",
      fr: "Stabilisateur d’hydratation",
    },
    CC: { en: "Calm Corrector", ko: "진정 교정형", fr: "Correcteur apaisant" },
    SC: {
      en: "Sensitive Caretaker",
      ko: "민감 케어형",
      fr: "Soin des peaux sensibles",
    },
  };

function t(locale: RouteLocale, ko: string, en: string, fr: string) {
  return locale === "ko" ? ko : locale === "fr" ? fr : en;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getOptionLabel(locale: RouteLocale, st: SkinTypeCode) {
  return locale === "ko"
    ? `${st} (${SKTI_LABEL[st].ko})`
    : locale === "fr"
      ? `${st} (${SKTI_LABEL[st].fr})`
      : `${st} (${SKTI_LABEL[st].en})`;
}

export default function SktiDropdown({
  routeLocale,
  q,
  cat,
  skinType,
}: {
  routeLocale: RouteLocale;
  q?: string;
  cat?: string;
  skinType?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const buttonLabel = useMemo(() => {
    if (!skinType)
      return t(routeLocale, "SKTI 전체", "All SKTI", "Tous les SKTI");
    return `SKTI: ${skinType}`;
  }, [routeLocale, skinType]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  function buildUrl(nextSkinType?: string) {
    const url = new URL(`http://local/${routeLocale}/products`);

    if (q) url.searchParams.set("q", q);
    if (cat) url.searchParams.set("cat", cat);
    if (nextSkinType) url.searchParams.set("skinType", nextSkinType);

    // 필터 바뀌면 페이지는 1로 초기화
    return `${url.pathname}${url.search}`;
  }

  function onSelect(nextSkinType?: string) {
    setOpen(false);
    router.push(buildUrl(nextSkinType));
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition",
          open
            ? "border-black bg-black text-white"
            : "border-black/15 bg-white text-black hover:bg-black/5",
        )}
      >
        <span>{buttonLabel}</span>
        <span className={cn("text-xs transition", open && "rotate-180")}>
          ⌄
        </span>
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-[260px] rounded-2xl border border-black/10 bg-white p-2 shadow-lg">
          <button
            type="button"
            onClick={() => onSelect(undefined)}
            className={cn(
              "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition",
              !skinType ? "bg-black text-white" : "hover:bg-black/5 text-black",
            )}
          >
            <span>{t(routeLocale, "전체", "All", "Tous")}</span>
            {!skinType ? <span className="text-xs opacity-70">✓</span> : null}
          </button>

          <div className="my-2 h-px bg-black/10" />

          {SKTI.map((st) => {
            const active = skinType === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => onSelect(st)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition",
                  active
                    ? "bg-black text-white"
                    : "hover:bg-black/5 text-black",
                )}
              >
                <span>{getOptionLabel(routeLocale, st)}</span>
                {active ? <span className="text-xs opacity-70">✓</span> : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
