import { redirect } from "next/navigation";
import type { Locale as RouteLocale } from "@/app/lib/i18n/config";
import { createClient } from "@/app/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import BookmarksGrid from "./BookmarksGrid";

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
    redirect(`/${routeLocale}`);
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      product: {
        select: {
          id: true,
          slug: true,
          brand: true,
          category: true,
          imageUrl: true,
          translations: {
            select: {
              locale: true,
              name: true,
              description: true,
            },
          },
        },
      },
    },
  });

  const products = bookmarks.map((b) => b.product);

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-black/10 bg-white p-8">
        <p className="text-sm font-medium text-black/50">
          {t(routeLocale, "찜 목록", "Bookmarks", "Favoris")}
        </p>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-black sm:text-4xl">
          {t(routeLocale, "내가 찜한 제품", "Your bookmarks", "Vos favoris")}
        </h1>
      </header>

      <BookmarksGrid products={products} routeLocale={routeLocale} />
    </div>
  );
}
