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
      `/${routeLocale}/login?next=${encodeURIComponent(`/${routeLocale}/dashboard/account`)}`,
    );
  }

  const email = user.email ?? "-";

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-black/10 bg-white p-8">
        <p className="text-sm font-medium text-black/50">
          {t(routeLocale, "계정", "Account", "Compte")}
        </p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-black sm:text-4xl">
          {t(routeLocale, "내 계정", "Your account", "Votre compte")}
        </h1>
        <p className="mt-3 text-sm text-black/50">{email}</p>
      </header>

      <section className="rounded-3xl border border-black/10 bg-white p-6 space-y-3">
        <div className="rounded-2xl border border-black/10 p-4">
          <p className="text-sm font-medium text-black">
            {t(
              routeLocale,
              "로그인 방식",
              "Login method",
              "Méthode de connexion",
            )}
          </p>
          <p className="mt-1 text-sm text-black/50">
            {t(routeLocale, "Google OAuth", "Google OAuth", "Google OAuth")}
          </p>
        </div>

        {/* Danger zone placeholder */}
        <div className="rounded-2xl border border-black/10 p-4">
          <p className="text-sm font-medium text-black">
            {t(
              routeLocale,
              "계정 관리",
              "Account actions",
              "Actions du compte",
            )}
          </p>
          <p className="mt-1 text-sm text-black/50">
            {t(
              routeLocale,
              "탈퇴(계정 삭제) 기능은 추후 추가할 예정이에요.",
              "Account deletion will be added later.",
              "La suppression du compte sera ajoutée plus tard.",
            )}
          </p>

          <button
            type="button"
            disabled
            className="mt-4 rounded-full border border-black/15 bg-white px-4 py-2 text-sm font-medium text-black/40 cursor-not-allowed"
          >
            {t(
              routeLocale,
              "탈퇴하기(준비중)",
              "Delete account (soon)",
              "Supprimer (bientôt)",
            )}
          </button>
        </div>
      </section>
    </div>
  );
}
