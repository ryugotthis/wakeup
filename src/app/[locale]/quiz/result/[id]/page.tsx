// src/app/[locale]/quiz/result/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Locale as RouteLocale } from "@/app/lib/i18n/config";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/app/lib/supabase/server";
import ResultActions from "./ResultActions";

type DataLocale = "KO" | "EN" | "FR";
type RawText = string | Record<string, string>;

type ProfileItem = { label: RawText; value: RawText };
type IngredientRow = {
  category: RawText;
  ingredients: RawText;
  benefits: RawText;
};
type AvoidRow = { category: RawText; ingredients: RawText; why: RawText };

type ResultTemplate = {
  skinType: string;
  title: RawText;
  sections: {
    personality: { title: RawText; body: RawText };
    skinProfile: { items?: ProfileItem[] };
    goodIngredients: { title: RawText; rows?: IngredientRow[] };
    avoidIngredients: { title: RawText; rows?: AvoidRow[] };
    dailyRoutine: {
      title: RawText;
      morning?: Record<string, string[]>;
      evening?: Record<string, string[]>;
    };
    weeklyCare: { title: RawText; items?: Record<string, string[]> };
    tip: { title: RawText; body: RawText };
  };
};

type ResultTemplatesJson = { templates: ResultTemplate[] };

function routeLocaleToDataLocale(locale: string): DataLocale {
  switch (locale) {
    case "ko":
      return "KO";
    case "en":
      return "EN";
    case "fr":
      return "FR";
    default:
      return "EN";
  }
}

function pickText(text: RawText, locale: DataLocale) {
  if (typeof text === "string") return text;
  return text[locale] ?? text["EN"] ?? Object.values(text)[0] ?? "";
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Chip({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "accent" | "dark";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium",
        tone === "accent" && "bg-[#DBEBF1] text-black",
        tone === "default" && "bg-black/5 text-black",
        tone === "dark" && "bg-black text-white",
      )}
    >
      {children}
    </span>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-black/10 bg-white p-8">
      <h2 className="text-sm font-medium text-black/50">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: RouteLocale; id: string }>;
}) {
  const { locale: routeLocale, id } = await params;
  const locale = routeLocaleToDataLocale(routeLocale);

  const result = await prisma.testResult.findUnique({ where: { id } });
  if (!result) return notFound();

  const templates = (await import("@/../seed/seed.results.json"))
    .default as ResultTemplatesJson;
  const template = templates.templates.find(
    (t) => t.skinType === result.skinType,
  );
  if (!template) return notFound();

  const title = pickText(template.title, locale);
  const s = template.sections;

  const heroLine =
    pickText(s.personality?.body, locale).split("\n")[0] || title;

  const typeValue = (s.skinProfile?.items ?? []).find(
    (it) =>
      pickText(it.label, locale).toLowerCase() ===
      (locale === "FR" ? "type" : "type"),
  );

  const goalItem = (s.skinProfile?.items ?? []).find((it) => {
    const label = pickText(it.label, locale).toLowerCase();
    return label === "goal" || label === "objectif" || label === "목표";
  });

  const concernItem = (s.skinProfile?.items ?? []).find((it) => {
    const label = pickText(it.label, locale).toLowerCase();
    return label === "concern" || label === "préoccupation" || label === "고민";
  });

  const goals = pickText(goalItem?.value ?? "", locale)
    .split(",")
    .map((x: string) => x.trim())
    .filter(Boolean);

  const concerns = pickText(concernItem?.value ?? "", locale)
    .split(",")
    .map((x: string) => x.trim())
    .filter(Boolean);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const shareUrl = `${origin}/${routeLocale}/quiz/result/${id}`;

  const ctaRetake =
    routeLocale === "ko"
      ? "다시 테스트"
      : routeLocale === "fr"
        ? "Refaire le test"
        : "Retake Test";

  return (
    <main className="min-h-screen bg-[#DBEBF1]/40 px-6 py-14">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="rounded-3xl border border-black/10 bg-white p-8">
          <div className="flex flex-col gap-6">
            <div className="min-w-0">
              <p className="text-sm font-medium text-black/50">Skin profile</p>

              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-black sm:text-4xl">
                {heroLine}
              </h1>

              <p className="mt-3 text-lg font-bold text-black/50">{title}</p>
            </div>
          </div>

          {/* Type chips */}
          <div className="mt-7 space-y-3">
            <div className="flex flex-wrap gap-2">
              {pickText(typeValue?.value ?? "", locale)
                .split("/")
                .map((x: string) => x.trim())
                .filter(Boolean)
                .map((x: string) => (
                  <Chip key={x} tone="default">
                    {x}
                    {}
                  </Chip>
                ))}
            </div>
          </div>

          {/* Goals / Concerns */}
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-black/50">Goals</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(goals.length ? goals : []).map((g) => (
                  <Chip key={g} tone="accent">
                    {g}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-black/50">Concerns</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(concerns.length ? concerns : []).map((c) => (
                  <Chip key={c} tone="default">
                    {c}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </header>

        <Section title={pickText(s.personality.title, locale)}>
          <p className="whitespace-pre-line text-sm leading-relaxed text-black/70">
            {pickText(s.personality.body, locale)}
          </p>
        </Section>

        <Section title={pickText(s.goodIngredients.title, locale)}>
          <div className="space-y-4">
            {(s.goodIngredients.rows ?? []).map((row, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-black/10 bg-white p-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Chip tone="dark">{pickText(row.category, locale)}</Chip>
                  <span className="text-sm text-black/70">
                    {pickText(row.ingredients, locale)}
                  </span>
                </div>
                <p className="mt-3 text-sm text-black/50">
                  {pickText(row.benefits, locale)}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section title={pickText(s.avoidIngredients.title, locale)}>
          <div className="space-y-4">
            {(s.avoidIngredients.rows ?? []).map((row, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-black/10 bg-white p-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Chip tone="default">{pickText(row.category, locale)}</Chip>
                  <span className="text-sm text-black/70">
                    {pickText(row.ingredients, locale)}
                  </span>
                </div>
                <p className="mt-3 text-sm text-black/50">
                  {pickText(row.why, locale)}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section title={pickText(s.dailyRoutine.title, locale)}>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl bg-black/5 p-5">
              <p className="text-sm font-semibold text-black">Morning</p>
              <ul className="mt-3 list-disc pl-5 text-sm text-black/70 space-y-1">
                {(s.dailyRoutine.morning?.[locale] ?? []).map(
                  (x: string, i: number) => (
                    <li key={i}>{x}</li>
                  ),
                )}
              </ul>
            </div>

            <div className="rounded-2xl bg-black/5 p-5">
              <p className="text-sm font-semibold text-black">Evening</p>
              <ul className="mt-3 list-disc pl-5 text-sm text-black/70 space-y-1">
                {(s.dailyRoutine.evening?.[locale] ?? []).map(
                  (x: string, i: number) => (
                    <li key={i}>{x}</li>
                  ),
                )}
              </ul>
            </div>
          </div>
        </Section>

        <Section title={pickText(s.weeklyCare.title, locale)}>
          <ul className="rounded-2xl bg-white p-5 text-sm text-black/70 space-y-2">
            {(s.weeklyCare.items?.[locale] ?? []).map(
              (x: string, i: number) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-black/50" />
                  <span>{x}</span>
                </li>
              ),
            )}
          </ul>
        </Section>

        <section className="rounded-3xl border border-black/10 bg-[#DBEBF1] p-8">
          <h2 className="text-sm font-medium text-black/60">
            {pickText(s.tip.title, locale)}
          </h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-black/70">
            {pickText(s.tip.body, locale)}
          </p>
        </section>

        {/* ✅ 저장하기 + 다시 테스트 (가로 정렬) + 하단 공유 아이콘 3개 */}
        <div className="flex flex-col ">
          {/* ✅ 이 래퍼가 '기준 폭'이 됨 (content width) */}
          <div className="inline-flex flex-col items-center gap-3">
            {/* 상단: 저장 / 다시 테스트 */}
            <div className="inline-flex flex-wrap gap-2">
              <ResultActions
                routeLocale={routeLocale}
                resultId={id}
                isAuthed={!!user}
                shareUrl={shareUrl}
                variant="buttons"
              />

              <Link
                href={`/${routeLocale}/quiz`}
                className="rounded-full border border-black/20 bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-[#DBEBF1] transition"
              >
                {ctaRetake}
              </Link>
            </div>

            {/* 하단: 공유 아이콘 (✅ 버튼 묶음 폭 기준 가운데) */}
            <ResultActions
              routeLocale={routeLocale}
              resultId={id}
              isAuthed={!!user}
              shareUrl={shareUrl}
              variant="icons"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
