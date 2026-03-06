// src/app/[locale]/products/SktiSelect.tsx
"use client";

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

const sktiOptionLabel = (routeLocale: RouteLocale, st: SkinTypeCode) =>
  routeLocale === "ko"
    ? `${st} (${SKTI_LABEL[st].ko})`
    : routeLocale === "fr"
      ? `${st} (${SKTI_LABEL[st].fr})`
      : `${st} (${SKTI_LABEL[st].en})`;

export default function SktiSelect({
  routeLocale,
  cat,
  q,
  skinType,
}: {
  routeLocale: RouteLocale;
  cat?: string;
  q?: string;
  skinType?: string;
}) {
  return (
    <form action={`/${routeLocale}/products`} method="GET">
      {/* 현재 상태 유지 */}
      {cat ? <input type="hidden" name="cat" value={cat} /> : null}
      {q ? <input type="hidden" name="q" value={q} /> : null}
      <input type="hidden" name="page" value="1" />

      <label className="block text-xs font-medium text-black/50">
        {t(routeLocale, "SKTI", "SKTI", "SKTI")}
      </label>

      <select
        name="skinType"
        defaultValue={skinType ?? ""}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="mt-2 h-10 w-[240px] rounded-full border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/30"
      >
        <option value="">{t(routeLocale, "전체", "All", "Tous")}</option>
        {SKTI.map((st) => (
          <option key={st} value={st}>
            {sktiOptionLabel(routeLocale, st)}
          </option>
        ))}
      </select>
    </form>
  );
}
