/**
 * 역할: 퀴즈 질문 JSON(behavior + preference)을 locale에 맞게 병합/정규화해서
 * 클라이언트에서 한 문항씩 렌더링하고, 사용자의 선택 답변을 {Q1:"Q1_A", ...} 형태로 수집한 뒤
 * 마지막에 제출(현재는 콘솔/알림, 추후 API로 연결)까지 처리하는 Quiz UI 컴포넌트.
 */

"use client";

import behaviorJson from "@/data/quiz/questions.behavior.json";
import preferenceJson from "@/data/quiz/questions.preference.json";
import { useMemo, useState } from "react";

type Locale = "KO" | "EN" | "FR";

/**
 *  JSON 질문 타입
 * - questions: [{ code, order, weight, text(질문), options(선택지): [{ id, text, skinType }] }]
 *
 * text가 다국어라면(예: text: {KO:"", EN:"", FR:""})인 경우도 있어서
 * 아래에서 "string이면 그대로, object면 locale로 선택"하는 헬퍼를 둠.
 */
type RawText = string | Record<string, string>;

type RawOption = {
  id: string; // "Q1_A" 같은 고유 id
  text: RawText;
  skinType?: string; // 지금은 표시용으로만 쓰고, 계산은 나중 단계에서
};

type RawQuestion = {
  code: string; // "Q1" ...
  order: number;
  weight?: number;
  text: RawText;
  options: RawOption[];
};

type RawQuizFile = {
  group: string;
  version: number;
  questions: RawQuestion[];
};

// 절대 undefined가 나오지 않게 보장 (예: JSON에서 누락된 필드가 있을 수 있으니)
function pickText(text: RawText, locale: Locale) {
  if (typeof text === "string") return text;
  return text[locale] ?? text["EN"] ?? Object.values(text)[0] ?? "";
}

/**
 * ✅ 화면 렌더용으로 정규화한 질문 타입
 */
type UIQuestion = {
  code: string;
  order: number;
  text: string;
  options: { id: string; text: string }[];
};

export default function QuizClient({ locale }: { locale: Locale }) {
  /**
   * behavior + preference 질문을 합쳐서 하나의 질문 배열로 만들기
   * - order 기준으로 정렬
   * - text/option text는 locale에 맞게 뽑아서 string으로 고정
   */
  const questions: UIQuestion[] = useMemo(() => {
    // ❗❗❕zod 같은 런타임 검증 사용하면 좋지만, 지금은 일단 as any로 넘김
    // 타입 검사를 강제로 통과시키는 더블 캐스팅
    const b = behaviorJson as unknown as RawQuizFile;
    const p = preferenceJson as unknown as RawQuizFile;

    const merged = [...(b.questions ?? []), ...(p.questions ?? [])];

    const normalized: UIQuestion[] = merged
      .map((q) => ({
        code: q.code,
        order: q.order,
        text: pickText(q.text, locale),
        options: (q.options ?? []).map((o) => ({
          id: o.id,
          text: pickText(o.text, locale),
        })),
      }))
      .sort((a, b) => a.order - b.order);

    return normalized;
  }, [locale]);

  /**
   *  answers state
   * - 형태: { Q1: "Q1_A", Q2: "Q2_D", ... }
   * - 너 computeSkinType에 그대로 넣을 수 있는 형태로 저장
   */
  const [answers, setAnswers] = useState<Record<string, string>>({});

  /**
   * ✅ 현재 보고 있는 질문 index
   */
  const [idx, setIdx] = useState(0);

  const current = questions[idx];
  const total = questions.length;

  /**
   *  현재 질문에 대한 선택된 옵션 id
   */
  const selectedOptionId = current ? answers[current.code] : undefined;

  /**
   *  옵션 선택 시:
   * 1) answers 업데이트
   * 2) (선택) 자동으로 다음 문제로 이동
   */
  const onSelect = (questionCode: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionCode]: optionId, // 예: Q1 -> "Q1_A"
    }));
  };

  /**
   * ✅ 다음으로 이동
   * - 다음 질문이 있으면 이동
   * - 없으면 그대로
   */
  const goNext = () => {
    setIdx((prev) => Math.min(prev + 1, total - 1));
  };

  /**
   * ✅ 이전으로 이동
   */
  const goPrev = () => {
    setIdx((prev) => Math.max(prev - 1, 0));
  };

  /**
   * ✅ 제출
   * - MVP에서는 저장/추천 없이 answers만 확인하면 됨
   * - 나중에 여기서 POST /api/test-results 로 연결하면 됨
   */
  const onSubmit = () => {
    console.log("✅ QUIZ SUBMIT answers:", answers);
    alert("Submitted! (check console)\n" + JSON.stringify(answers, null, 2));
  };

  /**
   * ✅ 진행률 계산
   * - answeredCount: 답한 문제 수
   */
  const answeredCount = Object.keys(answers).length;
  const isLast = idx === total - 1;

  // 로딩/에러 방어 (질문이 비어있으면)
  if (!current) {
    return (
      <div>
        <p>질문 데이터를 찾을 수 없어요. JSON 파일을 확인해 주세요.</p>
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {JSON.stringify({ locale, total }, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <section style={{ marginTop: 16 }}>
      {/* 상단 진행 표시 */}
      <div
        style={{ display: "flex", justifyContent: "space-between", gap: 12 }}
      >
        <div>
          <div style={{ fontSize: 14, opacity: 0.7 }}>
            {idx + 1} / {total}
          </div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>
            Answered: {answeredCount}
          </div>
        </div>

        {/* 아주 단순한 진행바 */}
        <div style={{ flex: 1, alignSelf: "center" }}>
          <div
            style={{
              height: 8,
              background: "rgba(0,0,0,0.08)",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.round(((idx + 1) / total) * 100)}%`,
                background: "rgba(0,0,0,0.5)",
              }}
            />
          </div>
        </div>
      </div>

      {/* 질문 */}
      <h2 style={{ marginTop: 20, fontSize: 20, lineHeight: 1.4 }}>
        {current.text}
      </h2>

      {/* 선택지 */}
      <ul style={{ listStyle: "none", padding: 0, marginTop: 16 }}>
        {current.options.map((opt) => {
          const active = selectedOptionId === opt.id;

          return (
            <li key={opt.id} style={{ marginBottom: 10 }}>
              <button
                type="button"
                onClick={() => onSelect(current.code, opt.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: active
                    ? "2px solid rgba(0,0,0,0.8)"
                    : "1px solid rgba(0,0,0,0.15)",
                  background: active ? "rgba(0,0,0,0.06)" : "white",
                  cursor: "pointer",
                }}
              >
                {opt.text}
              </button>
            </li>
          );
        })}
      </ul>

      {/* 하단 버튼 */}
      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
        <button
          type="button"
          onClick={goPrev}
          disabled={idx === 0}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.15)",
            background: idx === 0 ? "rgba(0,0,0,0.05)" : "white",
            cursor: idx === 0 ? "not-allowed" : "pointer",
          }}
        >
          Prev
        </button>

        {!isLast ? (
          <button
            type="button"
            onClick={goNext}
            disabled={!selectedOptionId} // 답 안 했으면 다음 못 가게
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.15)",
              background: !selectedOptionId ? "rgba(0,0,0,0.05)" : "white",
              cursor: !selectedOptionId ? "not-allowed" : "pointer",
            }}
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={answeredCount < total} // 전체 답해야 제출 가능(원하면 완화 가능)
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.15)",
              background: answeredCount < total ? "rgba(0,0,0,0.05)" : "white",
              cursor: answeredCount < total ? "not-allowed" : "pointer",
            }}
          >
            Submit
          </button>
        )}
      </div>

      {/* 디버그: answers 미리 보기 */}
      <details style={{ marginTop: 18 }}>
        <summary style={{ cursor: "pointer" }}>Debug: answers JSON</summary>
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {JSON.stringify(answers, null, 2)}
        </pre>
      </details>
    </section>
  );
}
