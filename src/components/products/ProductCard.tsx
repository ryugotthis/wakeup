import Image from "next/image";
import Link from "next/link";
import type { Locale as RouteLocale } from "@/app/lib/i18n/config";
import BookmarkButton from "@/components/products/BookmarkButton";

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

type ProductCardProps = {
  productId: string;
  routeLocale: RouteLocale;
  slug: string;
  category: string;
  name: string;
  brand?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  tagLabels?: string[];
  isAuthed: boolean;
  initialBookmarked?: boolean;
  onRequireLogin?: (productId: string) => void;
  bookmarkMode?: "normal" | "remove-only";
};

export default function ProductCard({
  productId,
  routeLocale,
  slug,
  category,
  name,
  brand,
  description,
  imageUrl,
  tagLabels = [],
  isAuthed,
  initialBookmarked,
  onRequireLogin,
  bookmarkMode = "normal",
}: ProductCardProps) {
  return (
    <Link
      href={`/${routeLocale}/products/${slug}`}
      className="group block"
      aria-label={name}
    >
      <article className="overflow-hidden rounded-3xl border border-black/10 bg-white transition hover:-translate-y-0.5 hover:shadow-md">
        <div className="relative aspect-square w-full bg-[#F7F7F7]">
          <div className="absolute right-3 top-3 z-10">
            <BookmarkButton
              productId={productId}
              isAuthed={isAuthed}
              label={t(routeLocale, "찜하기", "Save", "Enregistrer")}
              initialBookmarked={initialBookmarked}
              onRequireLogin={onRequireLogin}
              mode={bookmarkMode}
            />
          </div>

          {imageUrl ? (
            <div className="relative h-full w-full p-8">
              <Image
                src={imageUrl}
                alt={name}
                fill
                className="object-contain transition duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#F7F7F7] text-sm text-black/35">
              {t(
                routeLocale,
                "이미지 준비 중",
                "Image coming soon",
                "Image bientôt",
              )}
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="min-w-0">
            <p className="text-xs font-medium text-black/40">{category}</p>

            <h3 className="mt-2 truncate text-lg font-semibold text-black">
              {name}
            </h3>

            {brand && <p className="mt-1 text-sm text-black/50">{brand}</p>}
          </div>

          {description ? (
            <p className="mt-3 line-clamp-3 text-sm text-black/60">
              {description}
            </p>
          ) : (
            <p className="mt-3 text-sm text-black/40">
              {t(
                routeLocale,
                "설명이 준비 중이에요.",
                "Description coming soon.",
                "Description bientôt.",
              )}
            </p>
          )}

          {tagLabels.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {tagLabels.slice(0, 4).map((label) => (
                <Chip key={label}>{label}</Chip>
              ))}
            </div>
          )}

          <div className="mt-5">
            <span className="inline-flex items-center rounded-full border border-black/20 bg-white px-4 py-2 text-sm font-medium text-black transition group-hover:bg-[#DBEBF1]">
              {t(routeLocale, "보기", "View", "Voir")}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
