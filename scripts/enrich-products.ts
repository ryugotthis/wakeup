/**
 * 역할: seed.products.json의 INCI(전성분) 문자열을 분석해서
 * - FRAGRANCE_FREE / ALCOHOL_FREE / ESSENTIAL_OIL_FREE 태그를 자동으로 추가하고
 * - 민감피부(HS) 기준 안전 점수(hsScore)를 계산해 제품 데이터에 반영한 뒤
 * - 결과를 seed.products.json에 다시 저장하는 전처리(Enrich) 스크립트.
 */

import fs from "node:fs";
import path from "node:path";

/**
 * ============================================
 * 📌 Tag 타입
 * ============================================
 */
type TagCode = "FRAGRANCE_FREE" | "ALCOHOL_FREE" | "ESSENTIAL_OIL_FREE";

/**
 * ============================================
 * 📌 Product 타입
 * ============================================
 */
type Product = {
  slug: string;
  inci?: string | null;
  tags: { code: string; priority?: number }[];
  hsScore?: number | null;
};

/**
 * ============================================
 * 📌 INCI 전처리
 * ============================================
 */

/**
 * INCI 문자열을 정규화
 * - 소문자 변환
 * - 괄호 제거
 * - 공백 정리
 */
function normalizeInci(raw: string) {
  return raw.toLowerCase().replace(/[()]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * INCI를 ingredient 단위 token 배열로 분리
 * - 쉼표 / 줄바꿈 / 세미콜론 기준 분리
 */
function tokenizeInci(raw: string): string[] {
  const normalized = normalizeInci(raw);

  return normalized
    .split(/[,;\n\r]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * ============================================
 * 📌 FRAGRANCE 검사
 * ============================================
 */

const FRAGRANCE_PATTERNS: RegExp[] = [
  /\bfragrance\b/i,
  /\bparfum\b/i,
  /\baroma\b/i,
  /\bperfume\b/i,
];

function hasFragrance(tokens: string[]) {
  const joined = tokens.join(" | ");
  return FRAGRANCE_PATTERNS.some((re) => re.test(joined));
}

/**
 * ============================================
 * 📌 ALCOHOL 검사
 *
 * 👉 정책:
 * "진짜 Alcohol Free = 모든 alcohol 없음"
 *
 * 따라서
 * - fatty alcohol 포함
 * - preservative alcohol 포함
 * - drying alcohol 포함
 *
 * 👉 alcohol 단어 들어가면 전부 alcohol 존재로 판단
 * ============================================
 */

const ALCOHOL_PATTERN = /\balcohol\b/i;

function hasAnyAlcohol(tokens: string[]) {
  return tokens.some((t) => ALCOHOL_PATTERN.test(t));
}

/**
 * ============================================
 * 📌 ESSENTIAL OIL 검사
 * (현재는 기본 리스트 기반)
 * ============================================
 */

const ESSENTIAL_OIL_KEYWORDS = [
  "lavender oil",
  "tea tree oil",
  "bergamot oil",
  "eucalyptus oil",
  "peppermint oil",
  "rosemary oil",
  "citrus oil",
];

function hasEssentialOil(tokens: string[]) {
  const joined = tokens.join(" | ");
  return ESSENTIAL_OIL_KEYWORDS.some((k) => joined.includes(k));
}

/**
 * ============================================
 * 📌 FREE TAG 계산
 * ============================================
 */

function checkFree(inciRaw: string) {
  const tokens = tokenizeInci(inciRaw);

  const fragrance = hasFragrance(tokens);
  const alcohol = hasAnyAlcohol(tokens);
  const essentialOil = hasEssentialOil(tokens);

  return {
    fragranceFree: !fragrance,
    alcoholFree: !alcohol,
    essentialOilFree: !essentialOil,
  };
}

/**
 * ============================================
 * 📌 HS SAFE SCORE 계산
 * ============================================
 */

function calcHSSafeScore(inciRaw: string): number {
  const tokens = tokenizeInci(inciRaw);
  const joined = tokens.join(" | ");

  let score = 50;

  /** ✅ 좋은 성분 */
  if (joined.includes("ceramide")) score += 10;
  if (joined.includes("panthenol")) score += 8;
  if (joined.includes("centella")) score += 8;
  if (joined.includes("beta glucan")) score += 8;
  if (joined.includes("hyaluronic")) score += 6;
  if (joined.includes("allantoin")) score += 6;

  /** ❌ 감점 성분 */
  if (hasFragrance(tokens)) score -= 30;
  if (hasEssentialOil(tokens)) score -= 25;
  if (hasAnyAlcohol(tokens)) score -= 20;

  return Math.max(0, Math.min(100, score));
}

/**
 * ============================================
 * 📌 태그 자동 추가
 * ============================================
 */

function upsertAutoTag(product: Product, code: TagCode) {
  const exists = product.tags.some((t) => t.code === code);
  if (!exists) {
    product.tags.push({ code, priority: 100 });
  }
}

/**
 * ============================================
 * 📌 MAIN
 * ============================================
 */

function main() {
  const file = path.join(process.cwd(), "seed/seed.products.json");

  const json = JSON.parse(fs.readFileSync(file, "utf-8"));
  const products: Product[] = json.products;

  for (const p of products) {
    if (!p.inci) continue;

    const free = checkFree(p.inci);

    if (free.fragranceFree) upsertAutoTag(p, "FRAGRANCE_FREE");
    if (free.alcoholFree) upsertAutoTag(p, "ALCOHOL_FREE");
    if (free.essentialOilFree) upsertAutoTag(p, "ESSENTIAL_OIL_FREE");

    p.hsScore = calcHSSafeScore(p.inci);
  }

  fs.writeFileSync(file, JSON.stringify(json, null, 2), "utf-8");

  console.log("✅ seed.products.json updated");
}

main();
