import { redirect } from "next/navigation";
import type { Locale as RouteLocale } from "@/app/lib/i18n/config";
import { createClient } from "@/app/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/products/ProductCard";

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
      `/${routeLocale}/login?next=${encodeURIComponent(
        `/${routeLocale}/dashboard/bookmarks`,
      )}`,
    );
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
          tags: {
            select: {
              tag: {
                select: {
                  code: true,
                  translations: {
                    select: { locale: true, label: true },
                  },
                },
              },
            },
            orderBy: { priority: "asc" },
            take: 4,
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

      {products.length === 0 ? (
        <section className="rounded-3xl border border-black/10 bg-white p-6">
          <div className="rounded-2xl bg-black/5 p-4">
            <p className="text-sm text-black/60">
              {t(
                routeLocale,
                "아직 찜한 제품이 없어요.",
                "No bookmarks yet.",
                "Aucun favori pour le moment.",
              )}
            </p>
          </div>
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              productId={p.id}
              routeLocale={routeLocale}
              slug={p.slug}
              category={p.category}
              name={p.translations?.[0]?.name ?? p.slug}
              brand={p.brand}
              description={p.translations?.[0]?.description ?? ""}
              imageUrl={p.imageUrl}
              tagLabels={[]}
              isAuthed={true}
              initialBookmarked={true}
              bookmarkMode="remove-only"
            />
          ))}
        </section>
      )}
    </div>
  );
}
