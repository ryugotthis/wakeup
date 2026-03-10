import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: {
          email: user.email ?? null,
          name:
            user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
          avatarUrl: user.user_metadata?.avatar_url ?? null,
        },
        create: {
          id: user.id,
          email: user.email ?? null,
          name:
            user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
          avatarUrl: user.user_metadata?.avatar_url ?? null,
        },
      });
    }
  }

  if (next) {
    return NextResponse.redirect(next);
  }

  return NextResponse.redirect(requestUrl.origin);
}
