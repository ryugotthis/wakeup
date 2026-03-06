import Link from "next/link";
import type { Locale as RouteLocale } from "@/app/lib/i18n/config";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/app/lib/supabase/server";
import SktiDropdown from "./SktiDropdown";
import ProductCard from "./ProductCard";
import LoginRequiredModal from "@/components/auth/LoginRequiredModal";

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

  const buildUrl = (next: Record<string, string | undefined>) => {
    const url = new URL(`http://local/${routeLocale}/products`);
    const base: Record<string, string | undefined> = {
      q: q || undefined,
      cat: cat || undefined,
      skinType: skinType || undefined,
      page: String(page),
    };
    const merged = { ...base, ...next };

    Object.entries(merged).forEach(([k, v]) => {
      if (!v) url.searchParams.delete(k);
      else url.searchParams.set(k, v);
    });

    return `${url.pathname}${url.search}`;
  };

  const selectedCategoryLabel = cat
    ? (CATEGORY_OPTIONS.find((c) => c.value === cat)?.label ?? cat)
    : null;

  return (
    <main className="min-h-screen bg-[#DBEBF1]/40 px-6 py-14">
      <div className="mx-auto max-w-6xl space-y-6">
        <LoginRequiredModal routeLocale={routeLocale} />

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

        <section className="space-y-4 rounded-3xl border border-black/10 bg-white p-6">
          <div>
            <p className="text-xs font-medium text-black/50">
              {t(routeLocale, "카테고리", "Category", "Catégorie")}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={buildUrl({ cat: undefined, page: "1" })}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition",
                  !cat
                    ? "border-black bg-black text-white"
                    : "border-black/15 bg-white text-black hover:bg-black/5",
                )}
              >
                {t(routeLocale, "전체", "All", "Tous")}
              </Link>

              {CATEGORY_OPTIONS.map((c) => {
                const active = cat === c.value;
                return (
                  <Link
                    key={c.value}
                    href={buildUrl({ cat: c.value, page: "1" })}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-medium transition",
                      active
                        ? "border-black bg-black text-white"
                        : "border-black/15 bg-white text-black hover:bg-black/5",
                    )}
                  >
                    {c.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-3">
              <SktiDropdown
                routeLocale={routeLocale}
                cat={cat}
                q={q}
                skinType={skinType}
              />
            </div>

            <form
              action={`/${routeLocale}/products`}
              method="GET"
              className="flex items-center gap-2"
            >
              {cat ? <input type="hidden" name="cat" value={cat} /> : null}
              {skinType ? (
                <input type="hidden" name="skinType" value={skinType} />
              ) : null}
              <input type="hidden" name="page" value="1" />

              <div>
                <label className="block text-xs font-medium text-black/50">
                  {t(routeLocale, "검색", "Search", "Rechercher")}
                </label>
                <input
                  name="q"
                  defaultValue={q}
                  placeholder={t(
                    routeLocale,
                    "제품명",
                    "Product name",
                    "Nom du produit",
                  )}
                  className="mt-2 h-10 w-full rounded-full border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/30 sm:w-[260px]"
                />
              </div>

              <button
                type="submit"
                className="mt-6 h-10 rounded-full bg-black px-5 text-sm font-medium text-white transition hover:opacity-90"
              >
                {t(routeLocale, "검색", "Go", "OK")}
              </button>
            </form>
          </div>
        </section>

        {products.length === 0 ? (
          <section className="rounded-3xl border border-black/10 bg-white p-8">
            <p className="text-sm text-black/60">
              {t(
                routeLocale,
                "조건에 맞는 제품이 없어요.",
                "No products found.",
                "Aucun produit trouvé.",
              )}
            </p>
          </section>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => {
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

              return (
                <ProductCard
                  key={p.id}
                  productId={p.id}
                  routeLocale={routeLocale}
                  slug={p.slug}
                  category={p.category}
                  name={name}
                  brand={p.brand}
                  description={desc}
                  imageUrl={p.imageUrl}
                  tagLabels={tagLabels}
                  isAuthed={isAuthed}
                />
              );
            })}
          </section>
        )}

        {totalPages > 1 && (
          <nav className="flex items-center justify-between rounded-3xl border border-black/10 bg-white p-4">
            <p className="text-xs text-black/50">
              {t(routeLocale, "페이지", "Page", "Page")} {page} / {totalPages} ·{" "}
              {t(routeLocale, "총", "Total", "Total")} {total}
            </p>

            <div className="flex gap-2">
              <Link
                aria-disabled={page <= 1}
                className={cn(
                  "rounded-full border border-black/20 bg-white px-4 py-2 text-sm font-medium transition",
                  page <= 1
                    ? "pointer-events-none text-black/30"
                    : "text-black hover:bg-[#DBEBF1]",
                )}
                href={buildUrl({ page: String(page - 1) })}
              >
                {t(routeLocale, "이전", "Prev", "Préc")}
              </Link>

              <Link
                aria-disabled={page >= totalPages}
                className={cn(
                  "rounded-full border border-black/20 bg-white px-4 py-2 text-sm font-medium transition",
                  page >= totalPages
                    ? "pointer-events-none text-black/30"
                    : "text-black hover:bg-[#DBEBF1]",
                )}
                href={buildUrl({ page: String(page + 1) })}
              >
                {t(routeLocale, "다음", "Next", "Suiv")}
              </Link>
            </div>
          </nav>
        )}
      </div>
    </main>
  );
}
