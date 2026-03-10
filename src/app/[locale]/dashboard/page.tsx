// src/app/[locale]/dashboard/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Locale as RouteLocale } from "@/app/lib/i18n/config";
import { createClient } from "@/app/lib/supabase/server";
import { prisma } from "@/lib/prisma";

function t(routeLocale: RouteLocale, ko: string, en: string, fr: string) {
  return routeLocale === "ko" ? ko : routeLocale === "fr" ? fr : en;
}

function formatDate(d: Date) {
  return d.toLocaleDateString();
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: RouteLocale }>;
}) {
  const { locale: routeLocale } = await params;

  // ✅ 로그인 체크
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect(`/${routeLocale}`);
  }

  // ✅ SKTI(저장한 테스트 결과) 목록
  const saved = await prisma.savedResult.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      testResult: {
        select: {
          id: true,
          skinType: true,
          createdAt: true,
        },
      },
    },
  });

  const latestCreated =
    saved
      .map((x) => x.testResult.createdAt)
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

  return (
    <div className="space-y-6">
      {/* ✅ Header */}
      <header className="rounded-3xl border border-black/10 bg-white p-8">
        <p className="text-sm font-medium text-black/50">
          {t(routeLocale, "SKTI 결과", "SKTI Results", "Résultats SKTI")}
        </p>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-black sm:text-4xl">
          {t(
            routeLocale,
            "나의 피부 타입 기록",
            "Your skin type history",
            "Votre historique de type de peau",
          )}
        </h1>

        <p className="mt-3 text-sm text-black/50">
          {saved.length === 0
            ? t(
                routeLocale,
                "아직 저장한 SKTI 결과가 없어요. 결과 페이지에서 ‘저장하기’를 눌러보세요.",
                "No saved SKTI results yet. Save one from the result page.",
                "Aucun résultat SKTI enregistré. Enregistrez-en un depuis la page résultat.",
              )
            : t(
                routeLocale,
                `총 ${saved.length}개 · 최신 결과 생성일 ${latestCreated ? formatDate(latestCreated) : "-"}`,
                `${saved.length} saved · Latest created ${latestCreated ? formatDate(latestCreated) : "-"}`,
                `${saved.length} enregistrés · Dernier créé le ${latestCreated ? formatDate(latestCreated) : "-"}`,
              )}
        </p>
      </header>

      {/* ✅ 카드 1개: SKTI 결과 리스트 */}
      <section className="rounded-3xl border border-black/10 bg-white p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-black">
            {t(routeLocale, "SKTI 결과", "SKTI Results", "Résultats SKTI")}
          </h2>

          <Link
            href={`/${routeLocale}/quiz`}
            className="rounded-full border border-black/20 bg-white px-4 py-2 text-xs font-medium text-black hover:bg-[#DBEBF1] transition"
          >
            {t(
              routeLocale,
              "테스트 하러가기",
              "Take the test",
              "Faire le test",
            )}
          </Link>
        </div>

        {saved.length === 0 ? (
          <div className="mt-4 rounded-2xl bg-black/5 p-4">
            <p className="text-sm text-black/60">
              {t(
                routeLocale,
                "결과 페이지에서 ‘저장하기’를 누르면 여기에 모아볼 수 있어요.",
                "Tap “Save” on your result page to keep it here.",
                "Cliquez sur “Enregistrer” sur votre page résultat pour le garder ici.",
              )}
            </p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-black/10">
            {saved.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between py-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-black">
                    {t(routeLocale, "피부 타입", "Skin type", "Type de peau")}{" "}
                    <span className="font-mono">
                      {item.testResult.skinType}
                    </span>
                  </p>
                  <p className="text-xs text-black/50">
                    {t(routeLocale, "생성", "Created", "Créé")} ·{" "}
                    {formatDate(item.testResult.createdAt)}
                  </p>
                </div>

                <Link
                  href={`/${routeLocale}/quiz/result/${item.testResult.id}`}
                  className="shrink-0 rounded-full bg-black px-4 py-2 text-xs font-medium text-white hover:opacity-90 transition"
                >
                  {t(routeLocale, "보기", "View", "Voir")}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ✅ 하단: 제품 추천 카드 (현재는 뼈대, 나중에 연결) */}
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-black/50">
              {t(routeLocale, "추천", "Recommended", "Recommandé")}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-black">
              {t(
                routeLocale,
                "제품 추천",
                "Product picks",
                "Produits recommandés",
              )}
            </h2>
          </div>

          <Link
            href={`/${routeLocale}/products`}
            className="rounded-full border border-black/20 bg-white px-4 py-2 text-xs font-medium text-black hover:bg-[#DBEBF1] transition"
          >
            {t(routeLocale, "전체 보기", "See all", "Tout voir")}
          </Link>
        </div>

        {/* ✅ 추천 카드들 */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-3xl border border-black/10 bg-white p-6">
            <p className="text-xs font-medium text-black/50">
              {t(routeLocale, "당신에게 추천", "For you", "Pour vous")}
            </p>
            <h3 className="mt-2 text-base font-semibold text-black">
              {t(
                routeLocale,
                "추천 로직 연결 예정",
                "Recommendation coming soon",
                "Recommandations bientôt disponibles",
              )}
            </h3>
            <p className="mt-2 text-sm text-black/50">
              {t(
                routeLocale,
                "SKTI 결과를 기반으로 제품을 자동 추천해줄게요.",
                "We’ll recommend products based on your SKTI results.",
                "Nous recommanderons des produits selon vos résultats SKTI.",
              )}
            </p>
          </div>

          <div className="rounded-3xl border border-black/10 bg-white p-6">
            <p className="text-xs font-medium text-black/50">
              {t(routeLocale, "빠른 선택", "Quick picks", "Sélection rapide")}
            </p>
            <h3 className="mt-2 text-base font-semibold text-black">
              {t(routeLocale, "저자극 루틴", "Gentle routine", "Routine douce")}
            </h3>
            <p className="mt-2 text-sm text-black/50">
              {t(
                routeLocale,
                "민감/장벽 케어 중심으로 먼저 보여줄 수 있어요.",
                "A starter set focused on barrier & sensitive care.",
                "Un kit orienté barrière & peau sensible.",
              )}
            </p>
          </div>

          <div className="rounded-3xl border border-black/10 bg-white p-6">
            <p className="text-xs font-medium text-black/50">
              {t(routeLocale, "탐색", "Explore", "Explorer")}
            </p>
            <h3 className="mt-2 text-base font-semibold text-black">
              {t(routeLocale, "제품 카탈로그", "Product catalog", "Catalogue")}
            </h3>
            <p className="mt-2 text-sm text-black/50">
              {t(
                routeLocale,
                "전체 제품을 보면서 태그로 필터링할 수 있어요.",
                "Browse all products and filter by tags.",
                "Parcourez les produits et filtrez par tags.",
              )}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
