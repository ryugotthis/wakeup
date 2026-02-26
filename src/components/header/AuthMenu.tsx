// src/components/header/AuthMenu.tsx
"use client";

/**
 * 역할: 로그인/로그아웃 메뉴(Client).
 * - 비로그인: Google 로그인 버튼
 * - 로그인: 이메일 표시 + Logout
 */

import { useRouter } from "next/navigation";
import { createClient } from "@/app/lib/supabase/client";
import type { Locale } from "@/app/lib/i18n/config";
import { useState } from "react";

export default function AuthMenu({
  locale,
  userEmail,
}: {
  locale: Locale;
  userEmail: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);

  const login = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const logout = async () => {
    // console.log("logout locale:", locale);
    await supabase.auth.signOut();
    router.refresh();
    // router.push(`/${locale}`);
  };

  if (!userEmail) {
    return (
      <button
        type="button"
        onClick={login}
        className="rounded-full border border-black/15 bg-white px-3 py-2 text-sm font-medium hover:bg-[#DBEBF1] transition"
      >
        Login
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full bg-[#DBEBF1] px-3 py-2 text-sm font-medium text-black hover:opacity-90 transition"
        title={userEmail}
      >
        👤
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-black/10 bg-white p-2 shadow-sm">
          <div className="px-3 py-2 text-xs text-black/70 break-all">
            {userEmail}
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push(`/${locale}/dashboard`);
            }}
            className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-[#DBEBF1] transition"
          >
            Dashboard
          </button>

          <button
            type="button"
            onClick={logout}
            className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-[#DBEBF1] transition"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
