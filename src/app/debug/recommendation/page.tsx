import { prisma } from "@/lib/prisma";
import { computeSkinType } from "@/domain/skinType/computeSkinType";

// ✅ 질문 데이터(behavior / preference)
// - 질문 텍스트/선택지/가중치 등 "테스트 설계" 자체가 들어있는 JSON
import behaviorJson from "@/data/quiz/questions.behavior.json";
import preferenceJson from "@/data/quiz/questions.preference.json";

// ✅ 타입(DS/OB/HS/CC/SC)별 추천 정책(=규칙 모음)
// - "DS면 어떤 카테고리를 더 보고, 어떤 태그를 필수로 하고, 어떤 태그에 가중치를 줄지"를
//   코드(if/else)가 아니라 "데이터 객체"로 정리해둔 것
import { RULES_BY_TYPE } from "@/domain/recommendation/rules";

// ✅ 실제 DB에서 후보 제품을 가져와서 점수화(태그 가중치) 후 Top3를 뽑는 함수
import { pickTopProducts } from "@/domain/recommendation/pickTopProducts";

export default async function Page() {
  /**
   * ✅ (1) answers: 사용자가 테스트에서 선택한 답변들(지금은 디버그용 mock)
   * - 예: Q1에서 A를 골랐으면 "Q1_A"
   * - 실제 서비스에서는 사용자가 UI에서 선택한 값을 서버로 보내고,
   *   여기서는 그 값을 받아서 넣게 될 거야.
   */
  const answers = {
    Q1: "Q1_C",
    Q2: "Q2_D",
    Q3: "Q3_D",
    Q4: "Q4_B",
    Q5: "Q5_D",
    Q6: "Q6_B",
    TIEBREAKER: "TIEBREAKER_D",
  };

  /**
   * ✅ (2) computed = computeSkinType(...) 결과값
   *
   * computeSkinType는 "사용자 답변(answers)"을 보고
   * -> 각 타입(DS/OB/HS/CC/SC)의 점수를 계산하고
   * -> 최종 타입(finalType)을 결정해서
   * -> 디버깅하기 좋은 형태로 결과를 반환하는 함수야.
   *
   * 즉 computed는:
   * - "이 사용자는 DS다" 같은 최종 결과 뿐 아니라
   * - "DS 점수 몇 점, OB 점수 몇 점..." 같은 계산 과정(중간 결과)도 담고 있을 가능성이 큼
   *
   * 예시 형태(너 구현에 따라 다르지만 보통 이런 느낌):
   * computed = {
   *   finalType: "DS",
   *   scores: { DS: 8, OB: 2, HS: 1, CC: 3, SC: 0 },
   *   metrics: { topTypes: ["DS","CC"], tieBreakerUsed: true, ... }
   * }
   *
   * 📌 여기서 behaviorJson / preferenceJson은
   * "질문 목록 + 선택지가 어떤 타입에 영향을 주는지" 같은 룰/설계 데이터고,
   * answers는 "사용자의 선택"이야.
   *
   * computeSkinType는 이 둘을 합쳐서 결과를 만들어내는 것.
   */
  const computed = computeSkinType(
    behaviorJson as any,
    preferenceJson as any,
    answers,
  );

  /**
   * ✅ (3) rule = RULES_BY_TYPE[computed.finalType]
   *
   * computed.finalType은 DS/OB/HS/CC/SC 중 하나야.
   *
   * RULES_BY_TYPE는 "타입별 추천 정책"을 모아둔 객체라서:
   * - computed.finalType이 "DS"면 -> DS 정책(rule)을 가져오고
   * - computed.finalType이 "OB"면 -> OB 정책(rule)을 가져와.
   *
   * 예:
   * rule = {
   *   preferredCategories: ["TONER","SERUM",...],
   *   requiredTagsAny: ["HYDRATING",...],
   *   boostTags: [{code:"SOOTHING", weight:2}, ...],
   *   limit: 3
   * }
   *
   * 📌 왜 이렇게 하냐?
   * - 추천 로직(쿼리/점수계산)은 pickTopProducts 하나로 고정하고,
   * - 타입별 추천 기준만 rule 데이터로 바꿔 끼우면
   *   유지보수/확장(정책 변경)이 훨씬 쉬워져.
   */
  const rule = RULES_BY_TYPE[computed.finalType];

  /**
   * ✅ (4) recommended = pickTopProducts(...)
   *
   * pickTopProducts는 크게 3단계를 해:
   *
   * 1) DB에서 "후보 제품 리스트"를 가져온다 (prisma.product.findMany)
   *    - isPublished: true
   *    - skinTypes에 computed.finalType이 포함된 것
   *    - 카테고리는 rule.preferredCategories 안에 있는 것
   *    - requiredTagsAny가 있으면 그 중 하나라도 가진 제품만(OR)
   *    - excludedTags가 있으면 포함된 제품은 제외
   *
   * 2) 가져온 후보 제품들에 대해 점수(score)를 매긴다
   *    - 제품이 가진 태그들 중에서
   *    - rule.boostTags에 들어있는 태그를 많이/높은 weight로 가진 제품일수록 점수가 올라감
   *
   * 3) 점수 순으로 정렬해서 Top 3만 반환한다 (rule.limit = 3)
   *
   * 결과 recommended는 "Product + translations + tags"가 포함된 배열이야.
   */
  const recommended = await pickTopProducts({
    prisma,
    skinType: computed.finalType,
    rule,
  });

  /**
   * ✅ (5) 화면에 디버그용으로 출력
   *
   * - Computed: 점수/최종 타입 등 "테스트 결과 계산"이 어떻게 나왔는지
   * - Rule Used: 어떤 추천 정책이 적용됐는지
   * - Recommended: 그 정책으로 DB에서 뽑힌 Top 3 제품이 뭔지
   *
   * 이 3개를 같이 보여주면
   * "왜 이 제품이 추천됐는지" 디버깅이 엄청 쉬워져.
   */
  return (
    <main style={{ padding: 24 }}>
      <h1>Debug / Recommendation</h1>

      <h2>Computed</h2>
      <pre>{JSON.stringify(computed, null, 2)}</pre>

      <h2>Rule Used</h2>
      <pre>{JSON.stringify(rule, null, 2)}</pre>

      <h2>Recommended (Top 3)</h2>
      <pre>{JSON.stringify(recommended, null, 2)}</pre>
    </main>
  );
}
