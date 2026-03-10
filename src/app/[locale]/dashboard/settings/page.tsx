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
    redirect(`/${routeLocale}}`);
  }

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-black/10 bg-white p-8">
        <p className="text-sm font-medium text-black/50">
          {t(routeLocale, "설정", "Settings", "Paramètres")}
        </p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-black sm:text-4xl">
          {t(routeLocale, "환경 설정", "Preferences", "Préférences")}
        </h1>
        <p className="mt-3 text-sm text-black/50">
          {t(
            routeLocale,
            "언어/알림 같은 설정을 여기서 관리하게 될 거예요.",
            "You’ll manage preferences like language and notifications here.",
            "Vous gérerez ici la langue et les notifications.",
          )}
        </p>
      </header>

      <section className="rounded-3xl border border-black/10 bg-white p-6 space-y-3">
        <div className="rounded-2xl border border-black/10 p-4">
          <p className="text-sm font-medium text-black">
            {t(routeLocale, "언어", "Language", "Langue")}
          </p>
          <p className="mt-1 text-sm text-black/50">
            {t(
              routeLocale,
              "현재: URL locale 기반",
              "Current: URL locale",
              "Actuel : locale URL",
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-black/10 p-4">
          <p className="text-sm font-medium text-black">
            {t(routeLocale, "알림", "Notifications", "Notifications")}
          </p>
          <p className="mt-1 text-sm text-black/50">
            {t(
              routeLocale,
              "추후 제공 예정",
              "Coming soon",
              "Bientôt disponible",
            )}
          </p>
        </div>
      </section>
    </div>
  );
}
