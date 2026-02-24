// src/domain/recommendation/rules.ts

/**
 * ✅ Prisma enum 타입 import (타입 전용 import)
 *
 * ProductCategory / SkinTypeCode / TagCode는
 * schema.prisma에 정의한 enum들이고,
 * 타입 안정성을 위해 그대로 사용한다.
 *
 * - ProductCategory: TONER, SERUM, CREAM ...
 * - SkinTypeCode: DS, OB, HS, CC, SC
 * - TagCode: HYDRATING, BARRIER_SUPPORT ...
 *
 * ⭐ 이렇게 Prisma enum을 쓰면 좋은 점
 * - 오타 방지 ("HYDRATNG" 같은 실수 즉시 타입 에러)
 * - DB에 들어있는 값들과 1:1로 매칭되어 안정적
 */
import type { ProductCategory, SkinTypeCode, TagCode } from "@prisma/client";

/**
 * ✅ RecommendationRule 타입
 *
 * "추천 정책(=규칙)"을 데이터로 표현한 구조.
 * 로직(if/else)로 추천 기준을 흩뿌리지 않고,
 * 여기 하나에 모아서 관리하기 위함.
 *
 * 이 Rule은 pickTopProducts 같은 추천 함수에 "입력"으로 들어가고,
 * 추천 함수는 이 rule을 보고:
 * - DB 후보를 어떻게 필터링할지
 * - 후보 제품에 어떤 기준으로 점수를 매길지
 * 를 결정한다.
 */
export type RecommendationRule = {
  /**
   * ✅ preferredCategories
   * - 후보군 필터링에 사용
   * - "이 타입이 주로 볼 만한 제품 카테고리" 목록
   *
   * 예) DS(건조/수분)면 보습 관련 카테고리(에센스/크림 등)를 포함
   * 예) SC(트러블)면 패드/토너처럼 관리용 카테고리 중심
   */
  preferredCategories: ProductCategory[];

  /**
   * ✅ requiredTagsAny (선택)
   * - 후보군 필터링에 사용 (OR 조건)
   * - "이 태그들 중 하나라도 가진 제품만 후보로 인정"
   *
   * 예) DS에서 ["HYDRATING","BARRIER_SUPPORT"]
   *     → 수분/장벽 중 하나라도 관련 있는 제품만 추천 후보에 들어옴
   *
   * ⭐ 왜 OR 조건?
   * - 모든 제품이 HYDRATING+BARIER 둘 다 갖는 건 아닐 수 있음
   * - 후보군을 너무 좁히지 않으면서도 “타입에 맞는 제품”만 남기려는 목적
   */
  requiredTagsAny?: TagCode[];

  /**
   * ✅ excludedTags (선택)
   * - 후보군 필터링에 사용 (제외 조건)
   * - "이 태그들 중 하나라도 포함하면 후보에서 제외"
   *
   * 예) 민감 타입(HS)에서 향료가 정말 싫다면 FRAGRANCE_FREE가 아니라
   *     오히려 "FRAGRANCE" 같은 태그를 제외로 둘 수 있음(지금은 그런 태그가 없지만 개념상)
   *
   * 현재 너의 TagCode 설계는 "FREE"류가 많아서 excludedTags보다는
   * required/boost로 쓰는게 자연스러움.
   */
  excludedTags?: TagCode[];

  /**
   * ✅ boostTags (선택)
   * - 후보군 "정렬(순위)"에 사용 (점수 가중치)
   * - 후보 제품이 가진 태그 중 boostTags에 있는 태그가 많을수록 점수가 올라감
   *
   * 예) DS에서
   *   HYDRATING(4점) + BARRIER_SUPPORT(3점) + SOOTHING(2점) ...
   *   → 이런 태그를 많이 가진 제품이 Top 3로 올라옴
   *
   * ⭐ weight를 왜 쓰냐?
   * - 단순히 "포함하면 +1"보다 더 섬세한 우선순위를 만들 수 있음
   * - 예) DS에서는 HYDRATING이 핵심이니 4점, SOOTHING은 보조니 2점
   */
  boostTags?: Array<{ code: TagCode; weight: number }>;

  /**
   * ✅ limit
   * - 결과를 몇 개 반환할지 (너는 Top 3 fixed)
   *
   * rule에 넣어두면:
   * - 타입별로 “Top 3”에서 “Top 5”로 바꾸고 싶을 때
   *   추천 로직을 안 건드리고 정책만 수정 가능
   */
  limit: number;
};

/**
 * ✅ RULES_BY_TYPE
 *
 * SkinTypeCode(DS/OB/HS/CC/SC)별 추천 정책을 모아둔 객체.
 *
 * 사용 흐름:
 * 1) computeSkinType(...)로 finalType을 구한다. (예: DS)
 * 2) RULES_BY_TYPE[finalType]로 해당 타입 정책(rule)을 선택한다.
 * 3) pickTopProducts({ rule })에 넣고 DB에서 추천 Top 3를 뽑는다.
 *
 * ⭐ 여기서 핵심은 “추천 로직”과 “추천 기준(정책)”을 분리했다는 것.
 * - 로직: pickTopProducts (고정)
 * - 기준: RULES_BY_TYPE (자주 바뀌는 부분)
 */
export const RULES_BY_TYPE: Record<SkinTypeCode, RecommendationRule> = {
  /**
   * 💧 DS (Dewy Seeker) - 건조/수분 타입
   *
   * 목표:
   * - 수분( HYDRATING )과 장벽( BARRIER_SUPPORT ) 중심
   * - 진정( SOOTHING ), 순함( GENTLE ), 자극 적은 성분(ALCOHOL_FREE)을 가산점
   */
  DS: {
    // 후보 카테고리: 보습/수분과 관련이 큰 라인업 위주
    preferredCategories: [
      "TONER",
      "ESSENCE",
      "SERUM",
      "AMPOULE",
      "CREAM",
      "MIST",
    ],

    // 후보 필터: HYDRATING 또는 BARRIER_SUPPORT 중 하나는 반드시 있어야 함(OR)
    requiredTagsAny: ["HYDRATING", "BARRIER_SUPPORT"],

    // 점수 우선순위: HYDRATING 최우선(4) > 장벽(3) > 진정(2) > 나머지(1)
    boostTags: [
      { code: "HYDRATING", weight: 4 },
      { code: "BARRIER_SUPPORT", weight: 3 },
      { code: "SOOTHING", weight: 2 },
      { code: "ALCOHOL_FREE", weight: 1 },
      { code: "GENTLE", weight: 1 },
    ],

    // Top 3만 반환
    limit: 3,
  },

  /**
   * 🛢 OB (Oil Balancer) - 유분/번들 타입
   *
   * 목표:
   * - 유분 조절(OIL_CONTROL), 가벼운 텍스처(LIGHTWEIGHT) 중심
   * - 여드름/모공 관점에서 NON_COMEDOGENIC에 가산점
   * - 피부 밸런스 관점에서 LOW_PH도 가산점
   */
  OB: {
    preferredCategories: ["TONER", "PAD", "ESSENCE", "SERUM", "MIST"],
    requiredTagsAny: ["OIL_CONTROL", "LIGHTWEIGHT", "LOW_PH"],
    boostTags: [
      { code: "OIL_CONTROL", weight: 4 },
      { code: "LIGHTWEIGHT", weight: 3 },
      { code: "NON_COMEDOGENIC", weight: 2 },
      { code: "LOW_PH", weight: 2 },
      { code: "GENTLE", weight: 1 },
    ],
    limit: 3,
  },

  /**
   * 🌿 HS (Hyper Sensitive) - 민감 타입
   *
   * 목표:
   * - 순함(GENTLE), 진정(SOOTHING), 장벽(BARRIER_SUPPORT) 최우선
   * - 향/에센셜오일/알코올 free 류도 강하게 가산점
   */
  HS: {
    preferredCategories: [
      "TONER",
      "ESSENCE",
      "SERUM",
      "AMPOULE",
      "CREAM",
      "MIST",
    ],
    requiredTagsAny: ["GENTLE", "SOOTHING", "BARRIER_SUPPORT"],
    boostTags: [
      { code: "GENTLE", weight: 4 },
      { code: "SOOTHING", weight: 3 },
      { code: "BARRIER_SUPPORT", weight: 3 },
      { code: "FRAGRANCE_FREE", weight: 2 },
      { code: "ESSENTIAL_OIL_FREE", weight: 2 },
      { code: "ALCOHOL_FREE", weight: 2 },
    ],
    limit: 3,
  },

  /**
   * ⚖️ CC (Calm Combo) - 복합/밸런스 타입
   *
   * 목표:
   * - 너무 리치하지 않으면서도 기본 수분/장벽은 챙기기
   * - LIGHTWEIGHT를 가장 중요하게, HYDRATING/BARRIER를 중간 정도
   */
  CC: {
    preferredCategories: ["TONER", "ESSENCE", "SERUM", "CREAM", "MIST", "PAD"],
    requiredTagsAny: ["LIGHTWEIGHT", "HYDRATING", "BARRIER_SUPPORT"],
    boostTags: [
      { code: "LIGHTWEIGHT", weight: 3 },
      { code: "HYDRATING", weight: 2 },
      { code: "BARRIER_SUPPORT", weight: 2 },
      { code: "SOOTHING", weight: 1 },
      { code: "LOW_PH", weight: 1 },
    ],
    limit: 3,
  },

  /**
   * 🧼 SC (Skin Clarity) - 트러블/깨끗함 타입
   *
   * 목표:
   * - ACNE_CARE / NON_COMEDOGENIC / LOW_PH 중심
   * - 자극 최소화(GENTLE, ALCOHOL_FREE)에는 약하게 가산점
   */
  SC: {
    preferredCategories: ["TONER", "PAD", "SERUM", "ESSENCE"],
    requiredTagsAny: ["ACNE_CARE", "LOW_PH", "NON_COMEDOGENIC"],
    boostTags: [
      { code: "ACNE_CARE", weight: 4 },
      { code: "LOW_PH", weight: 3 },
      { code: "NON_COMEDOGENIC", weight: 3 },
      { code: "GENTLE", weight: 1 },
      { code: "ALCOHOL_FREE", weight: 1 },
    ],
    limit: 3,
  },
};
