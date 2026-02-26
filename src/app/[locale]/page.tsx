import LoginButton from "@/components/LoginButton";
import LogoutButton from "@/components/LogoutButton";
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
    <main className="p-6 space-y-4">
      <h1>Home ({locale})</h1>

      {user ? (
        <div className="space-y-3">
          <div className="text-sm">
            ✅ Logged in as: <b>{user.email}</b>
          </div>
          <LogoutButton />
        </div>
      ) : (
        <LoginButton />
      )}
    </main>
  );
}
