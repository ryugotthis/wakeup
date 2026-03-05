import { redirect } from "next/navigation";
import type { Locale as RouteLocale } from "@/app/lib/i18n/config";
import { createClient } from "@/app/lib/supabase/server";

function t(routeLocale: RouteLocale, ko: string, en: string, fr: string) {
  return routeLocale === "ko" ? ko : routeLocale === "fr" ? fr : en;
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: RouteLocale }>;
}) {
  const { locale: routeLocale } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect(
      `/${routeLocale}/login?next=${encodeURIComponent(`/${routeLocale}/dashboard/favorites`)}`,
    );
  }

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-black/10 bg-white p-8">
        <p className="text-sm font-medium text-black/50">
          {t(routeLocale, "찜 목록", "Favorites", "Favoris")}
        </p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-black sm:text-4xl">
          {t(routeLocale, "내가 찜한 제품", "Your favorites", "Vos favoris")}
        </h1>
        <p className="mt-3 text-sm text-black/50">
          {t(
            routeLocale,
            "곧 제품 찜 기능을 추가할 예정이에요.",
            "Favorites feature is coming soon.",
            "La fonctionnalité favoris arrive bientôt.",
          )}
        </p>
      </header>

      <section className="rounded-3xl border border-black/10 bg-white p-6">
        <div className="rounded-2xl bg-black/5 p-4">
          <p className="text-sm text-black/60">
            {t(
              routeLocale,
              "아직 찜한 제품이 없어요.",
              "No favorites yet.",
              "Aucun favori pour le moment.",
            )}
          </p>
        </div>
      </section>
    </div>
  );
}
