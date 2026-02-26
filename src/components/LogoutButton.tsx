"use client";

/**
 * 역할: 로그인된 사용자가 Supabase 세션을 종료(logout)하도록 처리하는 버튼.
 * - signOut 호출
 * - 현재 locale 경로로 리다이렉트
 */

import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/app/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale ?? "en";

  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh(); // 서버 세션 다시 읽게 함
    router.push(`/${locale}`);
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
    >
      Logout
    </button>
  );
}
