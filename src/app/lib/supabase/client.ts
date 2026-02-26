/**
 * 역할: 브라우저(Client Component)에서 사용할 Supabase 클라이언트를 생성한다.
 * - Google 로그인, 로그아웃, 세션 관리 등 클라이언트 측 Auth 작업에 사용
 * - 환경변수에 설정된 Supabase URL과 anon key를 기반으로 초기화
 */

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
