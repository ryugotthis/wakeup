"use client";

/**
 * 역할: 퀴즈 질문 JSON(behavior + preference)을 locale에 맞게 병합/정규화해서
 * 클라이언트에서 한 문항씩 렌더링하고, 사용자의 선택 답변을 {Q1:"Q1_A", ...} 형태로 수집한 뒤
 * 제출 API로 전송하고 결과 페이지로 이동하는 Quiz UI 컴포넌트.
 */

import behaviorJson from "@/data/quiz/questions.behavior.json";
import preferenceJson from "@/data/quiz/questions.preference.json";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Locale = "KO" | "EN" | "FR";
type RawText = string | Record<string, string>;

function pickText(text: RawText, locale: Locale) {
  if (typeof text === "string") return text;
  return text[locale] ?? text["EN"] ?? Object.values(text)[0] ?? "";
}

type UIQuestion = {
  code: string;
  order: number;
  text: string;
  options: { id: string; text: string }[];
};

type RawOption = {
  id: string; // TestChoice.key (예: "A", "B")
  text: RawText; // TestChoiceTranslation.text
};

type RawQuestion = {
  code: string; // TestQuestionCode (예: "Q1")
  order: number; // TestQuestion.order
  text: RawText; // TestQuestionTranslation.text
  options?: RawOption[];
};

type RawQuizJson = {
  questions?: RawQuestion[];
};

export default function QuizClient({ locale }: { locale: Locale }) {
  const router = useRouter();

  const questions: UIQuestion[] = useMemo(() => {
    const b = behaviorJson as RawQuizJson;
    const p = preferenceJson as RawQuizJson;

    return [...(b.questions ?? []), ...(p.questions ?? [])]
      .map((q) => ({
        code: q.code,
        order: q.order,
        text: pickText(q.text, locale),
        options: (q.options ?? []).map((o) => ({
          // any 제거
          id: o.id,
          text: pickText(o.text, locale),
        })),
      }))
      .sort((a, b) => a.order - b.order);
  }, [locale]);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [idx, setIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const current = questions[idx];
  const total = questions.length;

  const selectedOptionId = current ? answers[current.code] : undefined;

  const onSelect = (questionCode: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionCode]: optionId,
    }));
  };

  const goNext = () => setIdx((prev) => Math.min(prev + 1, total - 1));
  const goPrev = () => setIdx((prev) => Math.max(prev - 1, 0));

  const onSubmit = async () => {
    if (submitting) return;

    const routeLocale = locale === "KO" ? "ko" : locale === "EN" ? "en" : "fr";

    try {
      setSubmitting(true);

      const res = await fetch(`/api/quiz/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      if (!res.ok) {
        alert("제출에 실패했어요. 다시 시도해주세요.");
        return;
      }

      const { id } = (await res.json()) as { id: string };
      router.push(`/${routeLocale}/quiz/result/${id}`);
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const isLast = idx === total - 1;

  if (!current) {
    return (
      <div className="p-6">
        <p>질문 데이터를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <section className="mt-6 space-y-6">
      {/* 상단 진행 표시 */}
      <div className="flex items-center gap-4">
        <div className="space-y-1">
          <div className="text-sm text-gray-500">
            {idx + 1} / {total}
          </div>
          <div className="text-xs text-gray-400">Answered: {answeredCount}</div>
        </div>

        {/* 진행바 */}
        <div className="flex-1">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-700 transition-all duration-300"
              style={{ width: `${Math.round(((idx + 1) / total) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 질문 */}
      <h2 className="text-xl font-semibold leading-relaxed text-black">
        {current.text}
      </h2>

      {/* 선택지 */}
      <ul className="space-y-3">
        {current.options.map((opt) => {
          const active = selectedOptionId === opt.id;

          return (
            <li key={opt.id}>
              <button
                type="button"
                onClick={() => onSelect(current.code, opt.id)}
                disabled={submitting}
                className={`
                  w-full text-left px-4 py-3 rounded-xl transition
                  ${
                    active
                      ? "border-2 border-black bg-black/5"
                      : "border border-gray-300 bg-white hover:bg-gray-50"
                  }
                  ${submitting ? "opacity-60 cursor-not-allowed" : ""}
                `}
              >
                {opt.text}
              </button>
            </li>
          );
        })}
      </ul>

      {/* 하단 버튼 */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={goPrev}
          disabled={idx === 0 || submitting}
          className={`
            px-4 py-2 rounded-lg border
            ${
              idx === 0 || submitting
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white hover:bg-gray-50"
            }
          `}
        >
          Prev
        </button>

        {!isLast ? (
          <button
            type="button"
            onClick={goNext}
            disabled={!selectedOptionId || submitting}
            className={`
              flex-1 px-4 py-2 rounded-lg border
              ${
                !selectedOptionId || submitting
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white hover:bg-gray-50"
              }
            `}
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={answeredCount < total || submitting}
            className={`
              flex-1 px-4 py-2 rounded-lg border
              ${
                answeredCount < total || submitting
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-black text-white hover:bg-black/90"
              }
            `}
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        )}
      </div>
    </section>
  );
}
