"use client";

import { useState } from "react";

type BookmarkButtonProps = {
  label: string;
  productId: string;
  initialBookmarked?: boolean;
};

export default function BookmarkButton({
  label,
  productId,
  initialBookmarked = false,
}: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);

  async function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;

    setLoading(true);

    try {
      if (bookmarked) {
        const res = await fetch(`/api/bookmarks/${productId}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          throw new Error("북마크 삭제 실패");
        }

        setBookmarked(false);
      } else {
        const res = await fetch("/api/bookmarks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId }),
        });

        if (!res.ok) {
          throw new Error("북마크 추가 실패");
        }

        setBookmarked(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

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
