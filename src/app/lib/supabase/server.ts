/**
 * 역할: 서버 컴포넌트(Server Component)에서 사용할 Supabase 클라이언트를 생성한다.
 * - SSR 환경에서 Supabase Auth 세션을 읽고 유지하기 위해 사용
 * - next/headers의 cookies()를 통해 요청(Request) 쿠키에 접근
 * - Supabase가 내부적으로 사용하는 세션 쿠키를 get/set 할 수 있도록 브리지 역할 수행
 * - Server Component에서는 직접 쿠키를 수정할 수 없기 때문에 setAll은 try/catch로 보호
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookies) {
          try {
            cookies.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component에서는 쿠키 수정 불가
          }
        },
      },
    },
  );
}
