"use client";

/**
 * 역할: 헤더 검색 버튼(Client)
 * - 모바일: 버튼 클릭 시 검색 모달 오픈
 * - 태블릿 이상: 버튼 클릭 시 인라인 검색창 토글
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
  const mobileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const isMobile = window.innerWidth < 640;
    if (isMobile) {
      mobileInputRef.current?.focus();
    } else {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open]);

  const submit = () => {
    const query = q.trim();
    if (!query) return;

    router.push(`/${locale}/search?q=${encodeURIComponent(query)}`);
    setOpen(false);
  };

  return (
    <>
      {/* Tablet / Mobile */}
      <div className="flex items-center lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center rounded-full p-2 transition hover:bg-[#DBEBF1]"
          aria-label="Search"
          title="Search"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm6.43-1.06 3.13 3.12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {open && (
          <div className="fixed inset-0 z-[100] bg-black/30">
            <div
              className="absolute inset-0"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />

            <div className="relative z-[101] border-b border-black/10 bg-white px-4 py-4 shadow-sm">
              <div className="mx-auto flex max-w-3xl items-center gap-2">
                <div className="flex flex-1 items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm6.43-1.06 3.13 3.12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>

                  <input
                    ref={mobileInputRef}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                    placeholder="Search products…"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full px-3 py-2 text-sm text-black/70 transition hover:bg-[#DBEBF1]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop */}
      <div className="hidden items-center lg:flex">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center justify-center rounded-full p-2 transition hover:bg-[#DBEBF1]"
          aria-label="Search"
          title="Search"
        >
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
            open ? "ml-2 w-56" : "ml-0 w-0",
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
              className="rounded-full px-2 py-1 text-xs font-medium transition hover:bg-[#DBEBF1]"
            >
              Go
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
