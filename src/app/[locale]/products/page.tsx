import Link from "next/link";
import type { Locale as RouteLocale } from "@/app/lib/i18n/config";

function t(routeLocale: RouteLocale, ko: string, en: string, fr: string) {
  return routeLocale === "ko" ? ko : routeLocale === "fr" ? fr : en;
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: RouteLocale }>;
}) {
  const { locale: routeLocale } = await params;

  return (
    <main className="min-h-screen bg-[#DBEBF1]/40 px-6 py-14">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-3xl border border-black/10 bg-white p-8">
          <p className="text-sm font-medium text-black/50">
            {t(routeLocale, "제품", "Products", "Produits")}
          </p>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-black sm:text-4xl">
            {t(
              routeLocale,
              "제품 둘러보기",
              "Explore products",
              "Découvrir les produits",
            )}
          </h1>
          <p className="mt-3 text-sm text-black/50">
            {t(
              routeLocale,
              "제품 리스트/필터/상세 페이지를 여기에 확장할 거예요.",
              "Product list, filters and detail pages will be added here.",
              "La liste, les filtres et la page produit seront ajoutés ici.",
            )}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href={`/${routeLocale}/quiz`}
              className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition"
            >
              {t(routeLocale, "SKTI 테스트", "Take SKTI", "Faire le SKTI")}
            </Link>
          </div>
        </header>

        <section className="rounded-3xl border border-black/10 bg-white p-6">
          <div className="rounded-2xl bg-black/5 p-4">
            <p className="text-sm text-black/60">
              {t(
                routeLocale,
                "아직 제품 리스트는 준비 중이에요.",
                "Product list is coming soon.",
                "La liste des produits arrive bientôt.",
              )}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
