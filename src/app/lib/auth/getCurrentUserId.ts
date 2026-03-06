import { createClient } from "@/app/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function getCurrentUserId() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: authUser.email },
    select: { id: true },
  });

  return user?.id ?? null;
}
