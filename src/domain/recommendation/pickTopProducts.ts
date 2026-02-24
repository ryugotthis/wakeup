// src/domain/recommendation/pickTopProducts.ts

import type {
  PrismaClient,
  ProductCategory,
  SkinTypeCode,
  TagCode,
} from "@prisma/client";
import type { RecommendationRule } from "./rules";

/**
 * ✅ 입력 파라미터 타입
 * - prisma: DB 접근용 PrismaClient 인스턴스
 * - skinType: 최종 스킨 타입 (DS/OB/HS/CC/SC)
 * - rule: 해당 타입에 적용할 추천 정책(=필터/가중치/limit 등)
 */
type PickParams = {
  prisma: PrismaClient;
  skinType: SkinTypeCode;
  rule: RecommendationRule;
};

/**
 * ✅ 반환 타입(디버그용)
 * - product: 실제 추천 제품
 * - score: 최종 점수(태그 점수 + hsScore 보정)
 * - breakdown: "왜 이 점수가 나왔는지" 근거
 *
 * ⭐ 이렇게 score/breakdown을 같이 반환하면
 * 추천 결과가 “왜 Top3인지”가 눈에 보이기 때문에 디버깅/정책 조정이 쉬움.
 */
export type PickedProduct = {
  product: any; // 필요하면 Prisma 타입(Product + include ...)로 더 엄격히 만들 수 있음
  score: number;
  breakdown: {
    tagScore: number;
    hsBonus: number;
    matchedBoostTags: Array<{ code: TagCode; weight: number }>;
    hsScore: number | null;
  };
};

/**
 * ✅ pickTopProducts
 *
 * 목적:
 * - rule을 기반으로 DB에서 후보 제품을 가져오고
 * - boostTags 가중치로 점수화한 뒤
 * - (HS 타입이면) hsScore(민감피부 안전 점수)를 추가 반영하여
 * - Top N(limit) 제품을 반환한다.
 *
 * IMPORTANT:
 * - 너가 준 hsScore 계산 코드(calcHSSafeScore)는
 *   "높을수록 안전" (0~100) 이므로
 *   HS 타입에서는 hsScore가 높을수록 더 좋은 점수를 받도록 보정해야 함.
 */
export async function pickTopProducts({
  prisma,
  skinType,
  rule,
}: PickParams): Promise<PickedProduct[]> {
  /**
   * ✅ rule 구조분해 + 기본값
   *
   * requiredTagsAny / excludedTags / boostTags가 undefined일 수도 있으니
   * 기본값을 빈 배열로 넣어서 아래 로직에서 조건처리를 깔끔하게 함.
   */
  const {
    preferredCategories,
    requiredTagsAny = [],
    excludedTags = [],
    boostTags = [],
    limit,
  } = rule;

  // ------------------------------------------------------------
  // 1) 후보 제품을 DB에서 가져오기 (Filtering)
  // ------------------------------------------------------------

  /**
   * ✅ findMany where 조건이 "후보군"을 만든다.
   *
   * 후보 필터 기준:
   * 1) isPublished = true (공개 제품만)
   * 2) skinTypes 배열에 skinType 포함 (해당 타입에 맞는 제품만)
   * 3) category ∈ preferredCategories (타입별 선호 카테고리)
   *
   * + 옵션 조건:
   * 4) requiredTagsAny가 있다면:
   *    - 그 중 하나라도 가진 제품만 통과 (OR)
   * 5) excludedTags가 있다면:
   *    - 그 중 하나라도 가진 제품은 제외 (NOT)
   */
  const products = await prisma.product.findMany({
    where: {
      isPublished: true,

      // Product.skinTypes 는 enum 배열이므로 { has: skinType }로 포함 여부 검사
      skinTypes: { has: skinType },

      // rule에서 허용한 카테고리만 후보로
      category: { in: preferredCategories as ProductCategory[] },

      // requiredTagsAny: OR 필터 (있을 때만 where에 추가)
      ...(requiredTagsAny.length
        ? {
            tags: {
              some: {
                tag: { code: { in: requiredTagsAny as TagCode[] } },
              },
            },
          }
        : {}),

      // excludedTags: 제외 필터 (있을 때만 where에 추가)
      ...(excludedTags.length
        ? {
            NOT: {
              tags: {
                some: { tag: { code: { in: excludedTags as TagCode[] } } },
              },
            },
          }
        : {}),
    },

    /**
     * include:
     * - translations: 제품명/설명 다국어
     * - tags: 제품-태그 조인(ProductTag) + 실제 Tag 정보(tag.code)
     *
     * 점수 계산에 tags가 필요하므로 반드시 포함.
     */
    include: {
      translations: true,
      tags: { include: { tag: true } },
    },
  });

  // ------------------------------------------------------------
  // 2) 태그 가중치 점수화를 위한 lookup map 만들기
  // ------------------------------------------------------------

  /**
   * ✅ weightMap
   * - boostTags를 Map<TagCode, weight> 형태로 바꿔서 빠르게 조회한다.
   *
   * 예:
   * boostTags: [{code:"HYDRATING", weight:4}, {code:"SOOTHING", weight:2}]
   * weightMap.get("HYDRATING") -> 4
   */
  const weightMap = new Map<TagCode, number>();
  for (const t of boostTags) {
    weightMap.set(t.code, t.weight);
  }

  // ------------------------------------------------------------
  // 3) 후보 제품 각각에 점수 매기기 (Scoring)
  // ------------------------------------------------------------

  const scored: PickedProduct[] = products.map((p) => {
    /**
     * ✅ 제품이 가진 태그 코드 목록 추출
     * p.tags는 ProductTag[] 형태이고, include로 tag를 포함했기 때문에 t.tag.code 접근 가능
     */
    const productTagCodes = p.tags.map((t) => t.tag.code);

    /**
     * ✅ tagScore 계산
     * - 제품이 가진 태그 코드 중에서 boostTags에 포함된 태그는 weight를 더한다.
     * - matchedBoostTags는 디버깅(왜 점수가 이렇지?)을 위한 근거 데이터.
     */
    let tagScore = 0;
    const matchedBoostTags: Array<{ code: TagCode; weight: number }> = [];

    for (const code of productTagCodes) {
      const w = weightMap.get(code as TagCode);
      if (w) {
        tagScore += w;
        matchedBoostTags.push({ code: code as TagCode, weight: w });
      }
    }

    /**
     * ✅ hsScore 보정 (HS 타입일 때만)
     *
     * 너가 준 calcHSSafeScore 기준:
     * - hsScore는 0~100 범위
     * - 높을수록 민감피부에게 안전
     *
     * 그래서 HS 타입이라면 hsScore가 높을수록 약간의 bonus를 준다.
     *
     * 📌 왜 "약간"만 주나?
     * - 추천의 주축은 정책(rule.boostTags)이어야 한다.
     * - hsScore가 너무 강하면 태그 정책이 무력화될 수 있다.
     *
     * 여기서는 기준값을 50으로 두고:
     * - hsScore가 50보다 크면 +bonus
     * - hsScore가 50보다 작으면 -bonus (안전성이 낮으면 랭킹이 내려가게)
     *
     * bonus 스케일:
     * - (hsScore - 50) * 0.05
     * - 예: hsScore 80 -> (30)*0.05 = +1.5점
     * - 예: hsScore 20 -> (-30)*0.05 = -1.5점
     */
    const hsScore: number | null = p.hsScore ?? null;

    const hsBonus = skinType === "HS" ? ((hsScore ?? 50) - 50) * 0.05 : 0;

    /**
     * ✅ 최종 점수
     * - tagScore: 정책(태그 가중치)
     * - hsBonus: HS일 때 안전 점수 보정
     */
    const score = tagScore + hsBonus;

    return {
      product: p,
      score,
      breakdown: {
        tagScore,
        hsBonus,
        matchedBoostTags,
        hsScore,
      },
    };
  });

  // ------------------------------------------------------------
  // 4) 점수 높은 순으로 정렬 후 Top N 반환
  // ------------------------------------------------------------

  /**
   * ✅ 내림차순 정렬
   * - score가 큰 제품이 앞에 오도록
   */
  scored.sort((a, b) => b.score - a.score);

  /**
   * ✅ Top limit개 반환 (너는 limit=3)
   */
  return scored.slice(0, limit);
}
