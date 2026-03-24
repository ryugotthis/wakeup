"use client";

import { useState } from "react";
import type { Locale as RouteLocale } from "@/app/lib/i18n/config";
import type { Locale, ProductCategory } from "@prisma/client";
import ProductCard from "@/components/products/ProductCard";

type ProductItem = {
  id: string;
  slug: string;
  brand: string | null;
  category: ProductCategory;
  imageUrl: string | null;
  translations: Array<{
    locale: Locale;
    name: string;
    description: string | null;
  }>;
};

export default function BookmarksGrid({
  products: initialProducts,
  routeLocale,
}: {
  products: ProductItem[];
  routeLocale: RouteLocale;
}) {
  const [products, setProducts] = useState(initialProducts);

  const handleRemoved = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  if (products.length === 0) {
    return (
      <section className="rounded-3xl border border-black/10 bg-white p-6">
        <div className="rounded-2xl bg-black/5 p-4">
          <p className="text-sm text-black/60">
            {routeLocale === "ko"
              ? "아직 찜한 제품이 없어요."
              : routeLocale === "fr"
                ? "Aucun favori pour le moment."
                : "No bookmarks yet."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => (
        <ProductCard
          key={p.id}
          productId={p.id}
          routeLocale={routeLocale}
          slug={p.slug}
          category={p.category}
          name={p.translations?.[0]?.name ?? p.slug}
          brand={p.brand ?? ""}
          description={p.translations?.[0]?.description ?? ""}
          imageUrl={p.imageUrl}
          tagLabels={[]}
          isAuthed={true}
          initialBookmarked={true}
          bookmarkMode="remove-only"
          onBookmarkRemoved={handleRemoved}
        />
      ))}
    </section>
  );
}
