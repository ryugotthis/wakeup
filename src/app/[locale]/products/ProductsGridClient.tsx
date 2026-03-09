"use client";

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@/app/lib/supabase/client";
import type { Locale as RouteLocale } from "@/app/lib/i18n/config";
import { buildAuthReturnUrl } from "@/app/lib/auth/authActionResume";
import LoginRequiredModal from "@/components/auth/LoginRequiredModal";
import ProductCard from "./ProductCard";

type ProductItem = {
  id: string;
  slug: string;
  category: string;
  name: string;
  brand?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  tagLabels?: string[];
  isBookmarked: boolean;
};

type Props = {
  routeLocale: RouteLocale;
  products: ProductItem[];
  isAuthed: boolean;
};

export default function ProductsGridClient({
  routeLocale,
  products,
  isAuthed,
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [pendingBookmarkProductId, setPendingBookmarkProductId] = useState<
    string | null
  >(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  function handleRequireLogin(productId: string) {
    setPendingBookmarkProductId(productId);
    setLoginModalOpen(true);
  }

  async function startGoogleLogin() {
    if (!pendingBookmarkProductId) return;

    setIsAuthLoading(true);

    try {
      localStorage.setItem(
        "pendingBookmarkProductId",
        pendingBookmarkProductId,
      );
    } catch {}

    const origin = window.location.origin;

    // 1) 로그인 후 실제로 돌아올 상품 페이지 URL
    const baseReturnUrl = buildAuthReturnUrl({
      origin,
      pathname,
      search: searchParams.toString(),
      actionParamKey: "bookmark",
      actionParamValue: "1",
    });

    const nextUrl = new URL(baseReturnUrl);
    nextUrl.searchParams.set("bookmarkProductId", pendingBookmarkProductId);

    // 2) 먼저 callback route를 거치도록 redirectTo 구성
    const callbackUrl = new URL(`${origin}/${routeLocale}/auth/callback`);
    callbackUrl.searchParams.set("next", nextUrl.toString());

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      console.error(error);
      setIsAuthLoading(false);
    }
  }

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            productId={product.id}
            routeLocale={routeLocale}
            slug={product.slug}
            category={product.category}
            name={product.name}
            brand={product.brand}
            description={product.description}
            imageUrl={product.imageUrl}
            tagLabels={product.tagLabels}
            isAuthed={isAuthed}
            initialBookmarked={product.isBookmarked}
            onRequireLogin={handleRequireLogin}
          />
        ))}
      </section>

      <LoginRequiredModal
        routeLocale={routeLocale}
        open={loginModalOpen}
        loading={isAuthLoading}
        onCancel={() => {
          setLoginModalOpen(false);
          setPendingBookmarkProductId(null);
        }}
        onConfirm={async () => {
          setLoginModalOpen(false);
          await startGoogleLogin();
        }}
      />
    </>
  );
}
