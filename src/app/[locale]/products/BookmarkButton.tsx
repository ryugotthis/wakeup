"use client";

import { useState } from "react";

type BookmarkButtonProps = {
  label: string;
  productId: string;
  initialBookmarked?: boolean;
  isAuthed: boolean;
};

export default function BookmarkButton({
  label,
  productId,
  initialBookmarked = false,
  isAuthed,
}: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);

  async function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    // 로그인 안 되어있으면 전역 모달 열기
    if (!isAuthed) {
      window.dispatchEvent(new Event("open-login-required-modal"));
      return;
    }

    if (loading) return;

    const previousBookmarked = bookmarked;
    const nextBookmarked = !bookmarked;

    setBookmarked(nextBookmarked);
    setLoading(true);

    try {
      if (previousBookmarked) {
        const res = await fetch(`/api/bookmarks/${productId}`, {
          method: "DELETE",
        });

        if (!res.ok) throw new Error("북마크 삭제 실패");
      } else {
        const res = await fetch("/api/bookmarks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId }),
        });

        if (!res.ok) throw new Error("북마크 추가 실패");
      }
    } catch (error) {
      console.error(error);
      setBookmarked(previousBookmarked);
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
