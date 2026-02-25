import LoginButton from "@/components/LoginButton";
import { createClient } from "@/app/lib/supabase/server";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main style={{ padding: 24 }}>
      <h1>Home ({locale})</h1>

      <div style={{ marginTop: 16 }}>
        {user ? (
          <div style={{ fontSize: 14 }}>
            ✅ Logged in as: <b>{user.email}</b>
          </div>
        ) : (
          <LoginButton />
        )}
      </div>
    </main>
  );
}
