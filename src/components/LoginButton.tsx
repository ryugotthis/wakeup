"use client";

import { createClient } from "@/app/lib/supabase/client";

export default function LoginButton() {
  const supabase = createClient();

  const login = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  };

  return <button onClick={login}>Login with Google</button>;
}
