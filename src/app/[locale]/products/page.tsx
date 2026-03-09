import Link from "next/link";
import type { Locale as RouteLocale } from "@/app/lib/i18n/config";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/app/lib/supabase/server";
import SktiDropdown from "./SktiDropdown";
import ProductsGridClient from "./ProductsGridClient";

type DataLocale = "KO" | "EN" | "FR";
type ProductCategory =
  | "TONER"
  | "PAD"
  | "ESSENCE"
  | "SERUM"
  | "AMPOULE"
  | "CREAM"
  | "MIST"
  | "OIL"
  | "MASK_PACK";

type SkinTypeCode = "DS" | "OB" | "HS" | "CC" | "SC";

function routeLocaleToDataLocale(locale: RouteLocale): DataLocale {
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

function t(routeLocale: RouteLocale, ko: string, en: string, fr: string) {
  return routeLocale === "ko" ? ko : routeLocale === "fr" ? fr : en;
}

function pickTranslation<
  T extends {
    locale: "KO" | "EN" | "FR";
    name: string;
    description?: string | null;
  },
>(translations: T[], locale: DataLocale) {
  const byLocale = translations.find((x) => x.locale === locale);
  const fallback =
    translations.find((x) => x.locale === "EN") ?? translations[0];
  return byLocale ?? fallback ?? null;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Chip({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "dark";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        tone === "dark" ? "bg-black text-white" : "bg-black/5 text-black",
      )}
    >
      {children}
    </span>
  );
}

const CATEGORY_OPTIONS: Array<{ value: ProductCategory; label: string }> = [
  { value: "TONER", label: "Toner" },
  { value: "PAD", label: "Pad" },
  { value: "ESSENCE", label: "Essence" },
  { value: "SERUM", label: "Serum" },
  { value: "AMPOULE", label: "Ampoule" },
  { value: "CREAM", label: "Cream" },
  { value: "MIST", label: "Mist" },
  { value: "OIL", label: "Oil" },
  { value: "MASK_PACK", label: "Mask pack" },
];

function isSkinType(v: unknown): v is SkinTypeCode {
  return v === "DS" || v === "OB" || v === "HS" || v === "CC" || v === "SC";
}

function isCategory(v: unknown): v is ProductCategory {
  return (
    v === "TONER" ||
    v === "PAD" ||
    v === "ESSENCE" ||
    v === "SERUM" ||
    v === "AMPOULE" ||
    v === "CREAM" ||
    v === "MIST" ||
    v === "OIL" ||
    v === "MASK_PACK"
  );
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: RouteLocale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: routeLocale } = await params;
  const dataLocale = routeLocaleToDataLocale(routeLocale);
  const sp = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthed = !!user;

  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const cat = isCategory(sp.cat) ? sp.cat : undefined;
  const skinType = isSkinType(sp.skinType) ? sp.skinType : undefined;

  const page = Math.max(
    1,
    Number(typeof sp.page === "string" ? sp.page : "1") || 1,
  );

  const PAGE_SIZE = 12;
  const skip = (page - 1) * PAGE_SIZE;

  const where: any = {
    isPublished: true,
    ...(cat ? { category: cat } : {}),
    ...(skinType ? { skinTypes: { has: skinType } } : {}),
    ...(q
      ? {
          translations: {
            some: {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
              ],
            },
          },
        }
      : {}),
  };

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        slug: true,
        brand: true,
        category: true,
        imageUrl: true,
        skinTypes: true,
        translations: {
          select: { locale: true, name: true, description: true },
        },
        tags: {
          select: {
            tag: {
              select: {
                code: true,
                translations: { select: { locale: true, label: true } },
              },
            },
          },
          orderBy: { priority: "asc" },
          take: 4,
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const selectedCategoryLabel = cat
    ? (CATEGORY_OPTIONS.find((c) => c.value === cat)?.label ?? cat)
    : null;

  const productItems = products.map((p) => {
    const tr = pickTranslation(p.translations as any, dataLocale);
    const name = tr?.name ?? p.slug;
    const desc = tr?.description ?? "";

    const tagLabels =
      p.tags?.map((x) => {
        const tt =
          x.tag.translations.find((z) => z.locale === dataLocale) ??
          x.tag.translations.find((z) => z.locale === "EN") ??
          x.tag.translations[0];
        return tt?.label ?? x.tag.code;
      }) ?? [];

    return {
      id: p.id,
      slug: p.slug,
      category: p.category,
      name,
      brand: p.brand,
      description: desc,
      imageUrl: p.imageUrl,
      tagLabels,
    };
  });

  return (
    <main className="min-h-screen bg-[#DBEBF1]/40 px-6 py-14">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* HEADER */}
        <header className="rounded-3xl border border-black/10 bg-white p-8">
          <p className="text-sm font-medium text-black/50">
            {t(routeLocale, "제품", "Products", "Produits")}
          </p>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-black sm:text-4xl">
            {t(
              routeLocale,
              "추천 제품",
              "Recommended products",
              "Produits recommandés",
            )}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {!cat && !skinType && !q ? (
              <Chip tone="dark">{t(routeLocale, "전체", "All", "Tous")}</Chip>
            ) : null}

            {selectedCategoryLabel ? (
              <Chip tone="dark">{selectedCategoryLabel}</Chip>
            ) : null}

            {skinType ? <Chip tone="dark">SKTI: {skinType}</Chip> : null}

            {q ? <Chip>q: {q}</Chip> : null}

            {cat || skinType || q ? (
              <Link
                href={`/${routeLocale}/products`}
                className="ml-1 text-xs text-black/50 underline underline-offset-4 transition hover:text-black"
              >
                {t(routeLocale, "필터 초기화", "Reset", "Réinitialiser")}
              </Link>
            ) : null}
          </div>
        </header>

        {/* FILTER */}
        <section className="space-y-4 rounded-3xl border border-black/10 bg-white p-6">
          <SktiDropdown
            routeLocale={routeLocale}
            cat={cat}
            q={q}
            skinType={skinType}
          />
        </section>

        {/* PRODUCTS GRID */}
        <ProductsGridClient
          routeLocale={routeLocale}
          products={productItems}
          isAuthed={isAuthed}
        />
      </div>
    </main>
  );
}
