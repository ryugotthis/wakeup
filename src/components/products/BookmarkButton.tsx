"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  clearAuthResumeState,
  shouldResumeAfterLogin,
} from "@/app/lib/auth/authActionResume";

type BookmarkButtonProps = {
  label: string;
  productId: string;
  initialBookmarked?: boolean;
  isAuthed: boolean;
  onRequireLogin?: (productId: string) => void;
  onRemoved?: (productId: string) => void;
  mode?: "normal" | "remove-only";
};

export default function BookmarkButton({
  label,
  productId,
  initialBookmarked = false,
  isAuthed,
  onRequireLogin,
  onRemoved,
  mode = "normal",
}: BookmarkButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setBookmarked(initialBookmarked);
  }, [initialBookmarked]);

  async function addBookmark(id: string) {
    const res = await fetch("/api/bookmarks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ productId: id }),
    });

    if (!res.ok) throw new Error("북마크 추가 실패");
  }

  async function removeBookmark(id: string) {
    const res = await fetch(`/api/bookmarks/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("북마크 삭제 실패");
  }

  async function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;

    if (mode === "remove-only") {
      setLoading(true);

      try {
        await removeBookmark(productId);
        setBookmarked(false);
        onRemoved?.(productId);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }

      return;
    }

    if (!isAuthed) {
      onRequireLogin?.(productId);
      return;
    }

    const previousBookmarked = bookmarked;
    const nextBookmarked = !bookmarked;

    setBookmarked(nextBookmarked);
    setLoading(true);

    try {
      if (previousBookmarked) {
        await removeBookmark(productId);
      } else {
        await addBookmark(productId);
      }
    } catch (error) {
      console.error(error);
      setBookmarked(previousBookmarked);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (mode === "remove-only") return;
    if (!isAuthed) return;
    if (bookmarked) return;

    const bookmarkProductIdParam = searchParams.get("bookmarkProductId");

    const shouldResume = shouldResumeAfterLogin({
      search: searchParams.toString(),
      actionParamKey: "bookmark",
      actionParamValue: "1",
      storageKey: "pendingBookmarkProductId",
      storageValue: productId,
    });

    const isTargetProduct = bookmarkProductIdParam === productId;

    if (!shouldResume || !isTargetProduct) return;

    (async () => {
      setLoading(true);
      try {
        await addBookmark(productId);
        setBookmarked(true);

        const cleanedUrl = clearAuthResumeState({
          pathname,
          search: searchParams.toString(),
          queryKeysToRemove: ["bookmark", "bookmarkProductId"],
          storageKeysToRemove: ["pendingBookmarkProductId"],
        });

        router.replace(cleanedUrl);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, [bookmarked, isAuthed, pathname, productId, router, searchParams, mode]);

  return (
    <button
      type="button"
      aria-label={label}
      onClick={handleClick}
      disabled={loading}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/90 text-base text-black shadow-sm backdrop-blur transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      {bookmarked ? "♥" : "♡"}
    </button>
  );
}
