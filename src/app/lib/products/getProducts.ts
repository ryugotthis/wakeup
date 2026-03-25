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

function logPerf(
  label: string,
  start: number,
  extra?: Record<string, unknown>,
) {
  if (process.env.ENABLE_PERF_LOG !== "true") return;

  const duration = (performance.now() - start).toFixed(1);

  if (extra) {
    console.log(`[getProducts MIN] ${label}: ${duration}ms`, extra);
    return;
  }

  console.log(`[getProducts MIN] ${label}: ${duration}ms`);
}

function getCacheKey(where: Prisma.ProductWhereInput) {
  return JSON.stringify(where);
}

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

  const countStart = performance.now();
  const total = q
    ? await prisma.product.count({ where })
    : await createCachedCount(where);

  logPerf("count", countStart, {
    total,
    usesCountCache: !q,
  });

  // relation 전부 제거한 최소 조회
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
    },
  });

  logPerf("findMany", findStart, {
    length: products.length,
  });

  const mapStart = performance.now();
  const items: ProductListItem[] = products.map((p) => {
    return {
      id: p.id,
      slug: p.slug,
      category: p.category,
      name: p.slug, // 임시
      brand: p.brand,
      description: "", // 임시
      imageUrl: p.imageUrl,
      tagLabels: [], // 임시
      isBookmarked: false, // 임시
    };
  });

  logPerf("map", mapStart, {
    items: items.length,
  });

  logPerf("total", totalStart, {
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    locale,
    hasUserId: Boolean(userId),
    q: q ?? "",
    cat: cat ?? null,
    skinType: skinType ?? null,
    page,
    pageSize,
  });

  return {
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    items,
  };
}
