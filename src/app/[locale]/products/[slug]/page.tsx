// src/app/[locale]/products/[slug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Locale as RouteLocale } from "@/app/lib/i18n/config";
import { prisma } from "@/lib/prisma";

type DataLocale = "KO" | "EN" | "FR";
type SkinTypeCode = "DS" | "OB" | "HS" | "CC" | "SC";
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

function getCategoryLabel(
  category: ProductCategory,
  routeLocale: RouteLocale,
): string {
  switch (category) {
    case "TONER":
      return t(routeLocale, "토너", "Toner", "Toner");
    case "PAD":
      return t(routeLocale, "패드", "Pad", "Pad");
    case "ESSENCE":
      return t(routeLocale, "에센스", "Essence", "Essence");
    case "SERUM":
      return t(routeLocale, "세럼", "Serum", "Sérum");
    case "AMPOULE":
      return t(routeLocale, "앰플", "Ampoule", "Ampoule");
    case "CREAM":
      return t(routeLocale, "크림", "Cream", "Crème");
    case "MIST":
      return t(routeLocale, "미스트", "Mist", "Brume");
    case "OIL":
      return t(routeLocale, "오일", "Oil", "Huile");
    case "MASK_PACK":
      return t(routeLocale, "마스크팩", "Mask pack", "Masque");
    default:
      return category;
  }
}

function getSkinTypeLabel(
  code: SkinTypeCode,
  routeLocale: RouteLocale,
): string {
  switch (code) {
    case "DS":
      return t(routeLocale, "건성", "Dry skin", "Peau sèche");
    case "OB":
      return t(
        routeLocale,
        "지성/트러블",
        "Oily / Blemish-prone",
        "Peau grasse / à imperfections",
      );
    case "HS":
      return t(
        routeLocale,
        "민감/수분",
        "Sensitive / Hydration-focused",
        "Peau sensible / hydratation",
      );
    case "CC":
      return t(routeLocale, "복합성", "Combination", "Peau mixte");
    case "SC":
      return t(routeLocale, "민감성", "Sensitive", "Peau sensible");
    default:
      return code;
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: RouteLocale; slug: string }>;
}) {
  const { locale: routeLocale, slug } = await params;
  const dataLocale = routeLocaleToDataLocale(routeLocale);

  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      brand: true,
      category: true,
      imageUrl: true,
      skinTypes: true,
      inci: true,
      hsScore: true,
      // 나중에 필드 추가 예정
      // externalUrl: true,
      translations: {
        select: {
          locale: true,
          name: true,
          description: true,
        },
      },
      tags: {
        select: {
          priority: true,
          tag: {
            select: {
              code: true,
              translations: {
                select: {
                  locale: true,
                  label: true,
                },
              },
            },
          },
        },
        orderBy: { priority: "asc" },
      },
    },
  });

  if (!product) notFound();

  const tr = pickTranslation(product.translations as any, dataLocale);
  const name = tr?.name ?? product.slug;
  const description = tr?.description ?? "";

  const categoryLabel = getCategoryLabel(
    product.category as ProductCategory,
    routeLocale,
  );

  const tagLabels =
    product.tags?.map((x) => {
      const tt =
        x.tag.translations.find((z) => z.locale === dataLocale) ??
        x.tag.translations.find((z) => z.locale === "EN") ??
        x.tag.translations[0];
      return tt?.label ?? x.tag.code;
    }) ?? [];

  return (
    <main className="min-h-screen bg-[#DBEBF1]/40 px-6 py-14">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Back */}
        <div>
          <Link
            href={`/${routeLocale}/products`}
            className="text-sm text-black/50 underline underline-offset-4 transition hover:text-black"
          >
            ←{" "}
            {t(
              routeLocale,
              "제품 목록으로",
              "Back to products",
              "Retour aux produits",
            )}
          </Link>
        </div>

        {/* Hero */}
        <section className="grid gap-6 rounded-3xl border border-black/10 bg-white p-6 lg:grid-cols-2 lg:p-8">
          {/* Left: Image */}
          <div className="rounded-3xl border border-black/10 bg-[#DBEBF1]/30 p-5">
            <div className="aspect-square overflow-hidden rounded-2xl border border-black/5 bg-white">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-black/30">
                  {t(
                    routeLocale,
                    "이미지가 준비 중이에요.",
                    "Image coming soon.",
                    "Image bientôt.",
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Main info */}
          <div className="flex flex-col justify-between">
            <div>
              <p className="text-sm font-medium text-black/40">
                {categoryLabel}
              </p>

              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-black sm:text-4xl">
                {name}
              </h1>

              {product.brand ? (
                <p className="mt-2 text-base text-black/50">{product.brand}</p>
              ) : null}

              <p className="mt-5 text-sm leading-7 text-black/65">
                {description ||
                  t(
                    routeLocale,
                    "상세 설명이 준비 중이에요.",
                    "Detailed description coming soon.",
                    "Description détaillée bientôt.",
                  )}
              </p>

              {tagLabels.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {tagLabels.map((label) => (
                    <Chip key={label}>{label}</Chip>
                  ))}
                </div>
              )}

              {product.skinTypes.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {product.skinTypes.map((code) => (
                    <Chip key={code} tone="dark">
                      {getSkinTypeLabel(code as SkinTypeCode, routeLocale)}
                    </Chip>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-black/20 bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-black/5"
              >
                ♡ {t(routeLocale, "찜하기", "Save", "Enregistrer")}
              </button>

              <a
                href="#"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                {t(
                  routeLocale,
                  "판매 사이트 보기",
                  "View product site",
                  "Voir le site produit",
                )}
              </a>
            </div>
          </div>
        </section>

        {/* Bottom content */}
        <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* Description */}
          <article className="rounded-3xl border border-black/10 bg-white p-6">
            <h2 className="text-lg font-semibold text-black">
              {t(
                routeLocale,
                "제품 설명",
                "Product details",
                "Détails du produit",
              )}
            </h2>

            <div className="mt-4 space-y-4 text-sm leading-7 text-black/65">
              <p>
                {description ||
                  t(
                    routeLocale,
                    "아직 상세 설명이 등록되지 않았어요.",
                    "No detailed description has been added yet.",
                    "Aucune description détaillée n’a encore été ajoutée.",
                  )}
              </p>

              <p className="text-black/45">
                {t(
                  routeLocale,
                  "나중에 여기에 추천 이유, 사용감, 루틴에서의 역할 같은 설명을 추가할 수 있어요.",
                  "Later, you can add recommendation reasons, texture notes, or how it fits in a routine here.",
                  "Plus tard, vous pourrez ajouter ici les raisons de recommandation, la texture ou son rôle dans la routine.",
                )}
              </p>
            </div>
          </article>

          {/* Meta info */}
          <aside className="rounded-3xl border border-black/10 bg-white p-6">
            <h2 className="text-lg font-semibold text-black">
              {t(routeLocale, "제품 정보", "Information", "Informations")}
            </h2>

            <dl className="mt-5 space-y-5 text-sm">
              <div>
                <dt className="text-black/40">
                  {t(routeLocale, "브랜드", "Brand", "Marque")}
                </dt>
                <dd className="mt-1 text-black">{product.brand ?? "-"}</dd>
              </div>

              <div>
                <dt className="text-black/40">
                  {t(routeLocale, "카테고리", "Category", "Catégorie")}
                </dt>
                <dd className="mt-1 text-black">{categoryLabel}</dd>
              </div>

              <div>
                <dt className="text-black/40">
                  {t(
                    routeLocale,
                    "추천 피부 타입",
                    "Recommended skin type",
                    "Type de peau recommandé",
                  )}
                </dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {product.skinTypes.length > 0 ? (
                    product.skinTypes.map((code) => (
                      <Chip key={code}>
                        {getSkinTypeLabel(code as SkinTypeCode, routeLocale)}
                      </Chip>
                    ))
                  ) : (
                    <span className="text-black/40">-</span>
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-black/40">
                  {t(routeLocale, "태그", "Tags", "Tags")}
                </dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {tagLabels.length > 0 ? (
                    tagLabels.map((label) => <Chip key={label}>{label}</Chip>)
                  ) : (
                    <span className="text-black/40">-</span>
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-black/40">INCI</dt>
                <dd className="mt-1 text-black/50">
                  {product.inci
                    ? product.inci
                    : t(routeLocale, "준비 중", "Coming soon", "Bientôt")}
                </dd>
              </div>

              <div>
                <dt className="text-black/40">HS Score</dt>
                <dd className="mt-1 text-black/50">
                  {product.hsScore ??
                    t(routeLocale, "준비 중", "Coming soon", "Bientôt")}
                </dd>
              </div>
            </dl>
          </aside>
        </section>

        {/* Related products placeholder */}
        <section className="rounded-3xl border border-black/10 bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-black">
              {t(
                routeLocale,
                "비슷한 제품",
                "You may also like",
                "Vous aimerez aussi",
              )}
            </h2>

            <Link
              href={`/${routeLocale}/products`}
              className="text-sm text-black/50 underline underline-offset-4 transition hover:text-black"
            >
              {t(routeLocale, "전체 보기", "View all", "Voir tout")}
            </Link>
          </div>

          <div className="mt-4 rounded-2xl border border-dashed border-black/10 bg-black/[0.02] p-6 text-sm text-black/45">
            {t(
              routeLocale,
              "여기에 같은 카테고리 또는 비슷한 피부타입의 관련 상품 카드 3개를 넣으면 돼요.",
              "You can place 3 related product cards here from the same category or similar skin types.",
              "Vous pourrez placer ici 3 cartes de produits liés de la même catégorie ou pour des types de peau similaires.",
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
