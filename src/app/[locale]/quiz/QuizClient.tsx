"use client";

/**
 * 역할: 퀴즈 질문 JSON(behavior + preference)을 locale에 맞게 병합/정규화해서
 * 클라이언트에서 한 문항씩 렌더링하고, 사용자의 선택 답변을 {Q1:"Q1_A", ...} 형태로 수집한 뒤
 * 마지막에 제출(현재는 콘솔/알림, 추후 API로 연결)까지 처리하는 Quiz UI 컴포넌트.
 */

import behaviorJson from "@/data/quiz/questions.behavior.json";
import preferenceJson from "@/data/quiz/questions.preference.json";
import { useMemo, useState } from "react";

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

export default function QuizClient({ locale }: { locale: Locale }) {
  const questions: UIQuestion[] = useMemo(() => {
    const b = behaviorJson as any;
    const p = preferenceJson as any;

    return [...(b.questions ?? []), ...(p.questions ?? [])]
      .map((q) => ({
        code: q.code,
        order: q.order,
        text: pickText(q.text, locale),
        options: (q.options ?? []).map((o: any) => ({
          id: o.id,
          text: pickText(o.text, locale),
        })),
      }))
      .sort((a, b) => a.order - b.order);
  }, [locale]);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [idx, setIdx] = useState(0);

  const current = questions[idx];
  const total = questions.length;

  const selectedOptionId = current ? answers[current.code] : undefined;

  const onSelect = (questionCode: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionCode]: optionId,
    }));
  };

  const goNext = () => {
    setIdx((prev) => Math.min(prev + 1, total - 1));
  };

  const goPrev = () => {
    setIdx((prev) => Math.max(prev - 1, 0));
  };

  const onSubmit = () => {
    console.log("QUIZ SUBMIT:", answers);
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
              style={{
                width: `${Math.round(((idx + 1) / total) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* 질문 */}
      <h2 className="text-xl font-semibold leading-relaxed">{current.text}</h2>

      {/* 선택지 */}
      <ul className="space-y-3">
        {current.options.map((opt) => {
          const active = selectedOptionId === opt.id;

          return (
            <li key={opt.id}>
              <button
                type="button"
                onClick={() => onSelect(current.code, opt.id)}
                className={`
                  w-full text-left px-4 py-3 rounded-xl transition
                  ${
                    active
                      ? "border-2 border-black bg-black/5"
                      : "border border-gray-300 bg-white hover:bg-gray-50"
                  }
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
          disabled={idx === 0}
          className={`
            px-4 py-2 rounded-lg border
            ${
              idx === 0
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
            disabled={!selectedOptionId}
            className={`
              flex-1 px-4 py-2 rounded-lg border
              ${
                !selectedOptionId
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
            disabled={answeredCount < total}
            className={`
              flex-1 px-4 py-2 rounded-lg border
              ${
                answeredCount < total
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-black text-white hover:bg-black/90"
              }
            `}
          >
            Submit
          </button>
        )}
      </div>
    </section>
  );
}
