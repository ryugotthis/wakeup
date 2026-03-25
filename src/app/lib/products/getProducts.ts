import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";

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

type GetProductsParams = {
  userId?: string;
  locale: DataLocale;
  q?: string;
  cat?: ProductCategory;
  skinType?: SkinTypeCode;
  page: number;
  pageSize: number;
};

export type ProductListItem = {
  id: string;
  slug: string;
  category: ProductCategory;
  name: string;
  brand?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  tagLabels: string[];
  isBookmarked: boolean;
};

function pickTranslation<
  T extends {
    locale: "KO" | "EN" | "FR";
    name?: string;
    description?: string | null;
    label?: string;
  },
>(translations: T[], locale: DataLocale) {
  const byLocale = translations.find((x) => x.locale === locale);
  const fallback =
    translations.find((x) => x.locale === "EN") ?? translations[0];
  return byLocale ?? fallback ?? null;
}

// 🔥 로그 함수
function logPerf(
  label: string,
  start: number,
  extra?: Record<string, unknown>,
) {
  if (process.env.NODE_ENV !== "development") return;

  const duration = (performance.now() - start).toFixed(1);

  if (extra) {
    console.log(`[getProducts] ${label}: ${duration}ms`, extra);
    return;
  }

  console.log(`[getProducts] ${label}: ${duration}ms`);
}

// 🔥 cache key
function getCacheKey(where: Prisma.ProductWhereInput) {
  return JSON.stringify(where);
}

// 🔥 count 캐싱
function createCachedCount(where: Prisma.ProductWhereInput) {
  const key = getCacheKey(where);

  return unstable_cache(
    async () => prisma.product.count({ where }),
    ["products-count", key],
    {
      revalidate: 60,
    },
  )();
}

export async function getProducts({
  userId,
  locale,
  q,
  cat,
  skinType,
  page,
  pageSize,
}: GetProductsParams): Promise<{
  total: number;
  totalPages: number;
  items: ProductListItem[];
}> {
  const totalStart = performance.now();

  const skip = (page - 1) * pageSize;

  const where: Prisma.ProductWhereInput = {
    isPublished: true,
    ...(cat ? { category: cat } : {}),
    ...(skinType ? { skinTypes: { has: skinType } } : {}),
    ...(q
      ? {
          translations: {
            some: {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                {
                  description: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
              ],
            },
          },
        }
      : {}),
  };

  // 🔥 count 측정
  const countStart = performance.now();
  const total = q
    ? await prisma.product.count({ where })
    : await createCachedCount(where);

  logPerf("count", countStart, {
    total,
    isCached: !q,
  });

  // 🔥 findMany 측정
  const findStart = performance.now();
  const products = await prisma.product.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    skip,
    take: pageSize,
    select: {
      id: true,
      slug: true,
      brand: true,
      category: true,
      imageUrl: true,
      translations: {
        select: { locale: true, name: true, description: true },
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
      ...(userId
        ? {
            bookmarks: {
              where: { userId },
              select: { id: true },
              take: 1,
            },
          }
        : {}),
    },
  });

  logPerf("findMany", findStart, {
    length: products.length,
  });

  // 🔥 map 측정
  const mapStart = performance.now();
  const items: ProductListItem[] = products.map((p) => {
    const tr = pickTranslation(p.translations, locale);
    const name = tr?.name ?? p.slug;
    const description = tr?.description ?? "";

    const tagLabels =
      p.tags?.map((x) => {
        const tt = pickTranslation(x.tag.translations, locale);
        return tt?.label ?? x.tag.code;
      }) ?? [];

    return {
      id: p.id,
      slug: p.slug,
      category: p.category,
      name,
      brand: p.brand,
      description,
      imageUrl: p.imageUrl,
      tagLabels,
      isBookmarked: "bookmarks" in p ? p.bookmarks.length > 0 : false,
    };
  });

  logPerf("map", mapStart, {
    items: items.length,
  });

  logPerf("total", totalStart, {
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });

  return {
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    items,
  };
}
