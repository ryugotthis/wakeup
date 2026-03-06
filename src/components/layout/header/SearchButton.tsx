// src/components/header/SearchButton.tsx
"use client";

/**
 * 역할: 헤더 검색 버튼(Client).
 * - 버튼 클릭 시 검색 입력창을 토글(확장/축소)
 * - 엔터 제출 시 /[locale]/search?q=... 로 이동
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/app/lib/i18n/config";

export default function SearchButton({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const submit = () => {
    const query = q.trim();
    if (!query) return;
    router.push(`/${locale}/search?q=${encodeURIComponent(query)}`);
    setOpen(false);
  };

  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center rounded-full p-2 hover:bg-[#DBEBF1] transition"
        aria-label="Search"
        title="Search"
      >
        {/* 돋보기 SVG */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm6.43-1.06 3.13 3.12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <div
        className={[
          "overflow-hidden transition-all",
          open ? "w-56 ml-2" : "w-0 ml-0",
        ].join(" ")}
      >
        <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5">
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Search products…"
            className="w-full bg-transparent text-sm outline-none"
          />
          <button
            type="button"
            onClick={submit}
            className="rounded-full px-2 py-1 text-xs font-medium hover:bg-[#DBEBF1] transition"
          >
            Go
          </button>
        </div>
      </div>
    </div>
  );
}
