// computeSkinType.ts

export type SkinTypeCode = "DS" | "OB" | "HS" | "CC" | "SC";

export type LocalizedText = {
  KO: string;
  EN: string;
  FR: string;
};

export type Option = {
  id: string;
  // ✅ seed가 KO/EN/FR을 넣는 구조로 바뀌었으니 text도 로컬라이즈 대응
  text: LocalizedText;
  skinType: SkinTypeCode | null;
};

export type Question = {
  code: string;
  order: number;
  weight: number;
  // ✅ seed가 KO/EN/FR을 넣는 구조로 바뀌었으니 text도 로컬라이즈 대응
  text: LocalizedText;
  // ✅ 더 이상 role("TIEBREAKER_ONLY")에 의존하지 않음
  options: Option[];
};

export type QuestionsJson = {
  group: string;
  version: number;
  questions: Question[];
};

export type AnswersMap = Record<string, string | null | undefined>;

const SKIN_TYPES: SkinTypeCode[] = ["DS", "OB", "HS", "CC", "SC"];

const TIEBREAKER_CODE = "TIEBREAKER" as const;

function isTieBreakerQuestion(q: Question) {
  return q.code === TIEBREAKER_CODE;
}

export function computeSkinType(
  behavior: QuestionsJson,
  preference: QuestionsJson,
  answers: AnswersMap,
) {
  const all = [...behavior.questions, ...preference.questions];

  const scores: Record<SkinTypeCode, number> = {
    DS: 0,
    OB: 0,
    HS: 0,
    CC: 0,
    SC: 0,
  };

  let tieBreaker: SkinTypeCode | null = null;

  for (const q of all) {
    const pickedId = answers[q.code];
    if (!pickedId) continue;

    const opt = q.options.find((o) => o.id === pickedId);
    if (!opt) continue;

    // ✅ 타이브레이커는 code === "TIEBREAKER"로 판별
    if (isTieBreakerQuestion(q)) {
      tieBreaker = opt.skinType ?? null;
      continue;
    }

    // ✅ 선호문항(Q14 등)에서 skinType이 null일 수도 있음
    if (!opt.skinType) continue;

    // ✅ 일반 문항 점수 누적 (가중치 반영)
    scores[opt.skinType] += q.weight;
  }

  const max = Math.max(...SKIN_TYPES.map((t) => scores[t]));
  const top = SKIN_TYPES.filter((t) => scores[t] === max);

  let finalType: SkinTypeCode;
  let tieBreakerUsed = false;

  if (top.length === 1) {
    finalType = top[0];
  } else {
    tieBreakerUsed = true;

    // ✅ 규칙:
    // 1) 타이브레이커 답이 동점 후보 중 하나면 그걸로 결정
    // 2) 아니면 CC가 후보에 있으면 CC 우선
    // 3) 아니면 후보 중 첫 번째
    finalType =
      tieBreaker && top.includes(tieBreaker)
        ? tieBreaker
        : top.includes("CC")
          ? "CC"
          : top[0];
  }

  return {
    finalType,
    scores,
    topTypes: top,
    tieBreakerUsed,
    tieBreakerAnswer: tieBreaker,
  };
}
