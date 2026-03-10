import { prisma } from "@/lib/prisma";

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

/**
 * 역할:
 * products 페이지에서 사용할 제품 목록을 조회하고,
 * UI에서 바로 사용할 수 있는 형태로 가공해서 반환한다.
 *
 * 포함 기능:
 * - 카테고리 / 피부타입 / 검색어 필터
 * - 페이지네이션
 * - 현재 로그인 사용자 기준 북마크 여부 포함
 * - locale 기준 제품명 / 설명 / 태그 라벨 가공
 */
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
  const skip = (page - 1) * pageSize;

  const where = {
    isPublished: true,
    ...(cat ? { category: cat } : {}),
    ...(skinType ? { skinTypes: { has: skinType } } : {}),
    ...(q
      ? {
          translations: {
            some: {
              OR: [
                { name: { contains: q, mode: "insensitive" as const } },
                {
                  description: {
                    contains: q,
                    mode: "insensitive" as const,
                  },
                },
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
    }),
  ]);

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

  return {
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    items,
  };
}
