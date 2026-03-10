// src/components/header/AuthMenu.tsx
"use client";

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
  const [open, setOpen] = useState(false);

  const login = async () => {
    const supabase = createClient();

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const logout = async () => {
    const supabase = createClient();

    setOpen(false);
    await supabase.auth.signOut();

    router.replace(`/${locale}`);
    router.refresh();
  };

  if (!userEmail) {
    return (
      <button
        type="button"
        onClick={login}
        className="rounded-full border border-black/15 bg-white px-3 py-2 text-sm font-medium transition hover:bg-[#DBEBF1]"
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
        className="rounded-full bg-[#DBEBF1] px-3 py-2 text-sm font-medium text-black transition hover:opacity-90"
        title={userEmail}
      >
        👤
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-black/10 bg-white p-2 shadow-sm">
          <div className="break-all px-3 py-2 text-xs text-black/70">
            {userEmail}
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push(`/${locale}/dashboard`);
            }}
            className="w-full rounded-xl px-3 py-2 text-left text-sm transition hover:bg-[#DBEBF1]"
          >
            Dashboard
          </button>

          <button
            type="button"
            onClick={logout}
            className="w-full rounded-xl px-3 py-2 text-left text-sm transition hover:bg-[#DBEBF1]"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
