// src/app/api/quiz/submit/route.ts
import { NextResponse } from "next/server";
import behavior from "@/data/quiz/questions.behavior.json";
import preference from "@/data/quiz/questions.preference.json";
import {
  computeSkinType,
  type QuestionsJson,
} from "@/domain/skinType/computeSkinType";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { answers } = (await req.json()) as {
    answers: Record<string, string | null | undefined>;
  };

  const computed = computeSkinType(
    behavior as QuestionsJson,
    preference as QuestionsJson,
    answers,
  );

  const created = await prisma.testResult.create({
    data: {
      skinType: computed.finalType,
      answers,
      scores: computed.scores,
      metrics: {
        topTypes: computed.topTypes,
        tieBreakerUsed: computed.tieBreakerUsed,
        tieBreakerAnswer: computed.tieBreakerAnswer,
      },
    },
    select: { id: true },
  });

  return NextResponse.json({ id: created.id });
}
