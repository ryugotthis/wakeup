import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/app/lib/supabase/server";

function isUuid(v: unknown): v is string {
  return (
    typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      v,
    )
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as {
      resultId?: string;
    } | null;

    const resultId = body?.resultId;
    if (!isUuid(resultId)) {
      return NextResponse.json({ error: "Invalid resultId" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const exists = await prisma.testResult.findUnique({
      where: { id: resultId },
      select: { id: true },
    });

    if (!exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const fullName =
      (user.user_metadata as any)?.full_name ??
      (user.user_metadata as any)?.name ??
      null;

    const avatarUrl = (user.user_metadata as any)?.avatar_url ?? null;

    // ✅ 핵심: User upsert → SavedResult upsert 를 한 트랜잭션으로
    const saved = await prisma.$transaction(async (tx) => {
      await tx.user.upsert({
        where: { id: user.id },
        update: {
          email: user.email ?? undefined,
          name: fullName ?? undefined,
          avatarUrl: avatarUrl ?? undefined,
        },
        create: {
          id: user.id,
          email: user.email ?? null,
          name: fullName,
          avatarUrl,
        },
        select: { id: true },
      });

      return tx.savedResult.upsert({
        where: {
          userId_testResultId: {
            userId: user.id,
            testResultId: resultId,
          },
        },
        update: {},
        create: {
          userId: user.id,
          testResultId: resultId,
        },
        select: { id: true, createdAt: true },
      });
    });

    return NextResponse.json({ ok: true, saved });
  } catch (e: any) {
    console.error("[api/results/save] error:", e);
    return NextResponse.json(
      {
        error: "Server error",
        name: e?.name,
        message: e?.message,
        code: e?.code,
      },
      { status: 500 },
    );
  }
}
