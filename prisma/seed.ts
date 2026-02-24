/**
 * 역할: Supabase(Postgres) DB에 **초기 데이터(태그/제품)를 업서트로 주입하는 Prisma Seed 스크립트**.
 *
 * - Prisma 7 + pg Pool + PrismaPg adapter로 DB 연결(Supabase SSL 포함)
 * - seed.tags.json / seed.products.json을 읽어 Tag/TagTranslation, Product/ProductTranslation, ProductTag 관계를 upsert
 * - 제품 1개 단위로 트랜잭션 처리해 원자성 보장(중간 실패 시 롤백)
 * - Tag를 미리 로드해 Map(code→id)로 N+1 쿼리 방지, ProductTag는 createMany로 대량 삽입
 */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

import {
  PrismaClient,
  Locale,
  TagCode,
  ProductCategory,
  SkinTypeCode,
} from "@prisma/client";

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * ✅ Prisma 7 + Postgres(Supabase) 연결 방식
 *
 * - Prisma 7부터는 일반적인 `new PrismaClient()`만으로는 환경에 따라 경고/제약이 생길 수 있고,
 *   특히 edge/서버리스 환경을 고려하면 adapter 또는 accelerate 등을 쓰는 형태가 권장돼.
 * - 여기서는 node-postgres(pg) Pool을 만들고, PrismaPg 어댑터를 연결하는 방식.
 *
 * ✅ Supabase는 보통 SSL이 필요해.
 * - 로컬에서 Supabase remote DB를 직접 물릴 때도 SSL 옵션이 필요한 경우가 많아서 넣어둠.
 * - `rejectUnauthorized: false`는 Supabase 같은 managed 환경에서 흔히 쓰는 설정.
 *   (회사 보안정책/환경에 따라 CA 설정을 따로 하는 경우도 있음)
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * ✅ seed JSON의 타입(스키마)
 * - JSON 파일 구조가 바뀌면 컴파일 타임에서 잡히도록 타입을 만들어둠.
 * - 실제 런타임 검증까지 하고 싶다면 zod 같은 걸 붙이면 더 안전해.
 */
type SeedTag = {
  code: TagCode;
  translations: Record<
    "KO" | "EN" | "FR",
    { label: string; description?: string | null }
  >;
};

type SeedProduct = {
  slug: string;
  brand?: string | null;
  category: ProductCategory;
  imageUrl?: string | null;
  skinTypes: SkinTypeCode[];
  inci?: string | null;
  hsScore?: number | null;
  translations: Record<
    "KO" | "EN" | "FR",
    { name: string; description?: string | null }
  >;
  tags: { code: TagCode; priority?: number }[];
};

/**
 * ✅ 중복되는 locale 반복을 없애기 위해 상수로 빼둠
 * - seed 데이터는 "KO/EN/FR" 키를 쓰고,
 * - DB에는 Prisma enum Locale.KO/EN/FR가 들어가니까 매핑을 둔다.
 */
const LOCALES = [
  ["KO", Locale.KO],
  ["EN", Locale.EN],
  ["FR", Locale.FR],
] as const;

/**
 * ✅ JSON 파일 읽기 유틸
 */
function readJSON<T>(p: string): T {
  return JSON.parse(fs.readFileSync(p, "utf-8")) as T;
}

/**
 * ✅ Tag 업서트
 * - tags는 code(TagCode)가 유니크라서 upsert가 깔끔해.
 * - translations는 (tagId, locale)이 유니크(복합 유니크)라서 그 키로 upsert.
 */
async function upsertTags(tags: SeedTag[]) {
  for (const t of tags) {
    // 1) Tag 자체 upsert (code가 unique)
    const tag = await prisma.tag.upsert({
      where: { code: t.code },
      update: {}, // code 외에 업데이트할 필드가 없으니 비워둠
      create: { code: t.code },
    });

    // 2) 각 locale별 번역 upsert
    for (const [key, locale] of LOCALES) {
      const tr = t.translations[key];

      await prisma.tagTranslation.upsert({
        // schema에서 @@unique([tagId, locale]) 만들어둔 걸 사용
        where: { tagId_locale: { tagId: tag.id, locale } },
        update: {
          label: tr.label,
          description: tr.description ?? null,
        },
        create: {
          tagId: tag.id,
          locale,
          label: tr.label,
          description: tr.description ?? null,
        },
      });
    }
  }
}

/**
 * ✅ Product 업서트
 *
 * 개선 포인트:
 * 1) ProductTag를 매번 loop에서 tag.findUnique로 찾으면 N+1 쿼리가 생김.
 *    → tags를 미리 다 로드해서 tagMap(code → id) 만들기
 * 2) (deleteMany → create loop) 도중 실패하면 데이터가 "반쯤" 상태가 될 수 있음.
 *    → product 1개 단위로 트랜잭션(tx)로 묶어서 원자성 보장.
 * 3) createMany를 사용해서 productTag 다건 삽입을 한 번에 처리.
 */
async function upsertProducts(products: SeedProduct[]) {
  /**
   * ✅ Tag 전체 미리 로드해서 Map 만들기
   * - 이후 product마다 tag를 찾을 때 DB를 추가로 안 두드림.
   * - 성능/안정성 둘 다 좋아짐.
   */
  const allTags = await prisma.tag.findMany({
    select: { id: true, code: true },
  });
  const tagMap = new Map<TagCode, { id: string }>();
  for (const t of allTags) {
    tagMap.set(t.code, { id: t.id });
  }

  for (const p of products) {
    /**
     * ✅ Product 단위 트랜잭션
     * - product upsert + translations upsert + productTag reset(삭제 후 재생성)을
     *   하나의 트랜잭션으로 묶으면,
     *   중간에 에러 나도 "전체 롤백"돼서 DB가 깨끗하게 유지됨.
     */
    await prisma.$transaction(async (tx) => {
      // 1) Product upsert (slug unique)
      const product = await tx.product.upsert({
        where: { slug: p.slug },
        update: {
          brand: p.brand ?? null,
          category: p.category,
          imageUrl: p.imageUrl ?? null,
          isPublished: true,
          inci: p.inci ?? null,
          hsScore: p.hsScore ?? null,
          skinTypes: p.skinTypes,
        },
        create: {
          slug: p.slug,
          brand: p.brand ?? null,
          category: p.category,
          imageUrl: p.imageUrl ?? null,
          isPublished: true,
          inci: p.inci ?? null,
          hsScore: p.hsScore ?? null,
          skinTypes: p.skinTypes,
        },
      });

      // 2) ProductTranslation upsert (productId, locale) unique
      for (const [key, locale] of LOCALES) {
        const tr = p.translations[key];

        await tx.productTranslation.upsert({
          where: { productId_locale: { productId: product.id, locale } },
          update: {
            name: tr.name,
            description: tr.description ?? null,
          },
          create: {
            productId: product.id,
            locale,
            name: tr.name,
            description: tr.description ?? null,
          },
        });
      }

      /**
       * 3) ProductTag 관계 갱신 전략
       *
       * 네 기존 코드는:
       * - 기존 관계 전부 deleteMany
       * - 새 관계를 하나씩 create
       *
       * 이 방식 자체는 OK지만,
       * - 중간 실패하면 절반만 들어간 상태가 될 수 있음(트랜잭션으로 해결)
       * - create를 N번 호출해서 느릴 수 있음(createMany로 개선)
       */

      // (a) 기존 관계 제거
      await tx.productTag.deleteMany({ where: { productId: product.id } });

      // (b) 새 관계를 만들 데이터 준비
      const tagRows = p.tags
        .map((tagRef) => {
          const mapped = tagMap.get(tagRef.code);
          if (!mapped) return null; // seed에 있는 tag가 DB에 없으면 스킵
          return {
            productId: product.id,
            tagId: mapped.id,
            priority: tagRef.priority ?? 100,
          };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null);

      /**
       * createMany는 한 번에 다 넣어서 빠름.
       * - 현재 우리는 deleteMany로 싹 지우고 다시 넣기 때문에 중복은 보통 없지만,
       *   방어적으로 skipDuplicates를 켜도 안전.
       */
      if (tagRows.length > 0) {
        await tx.productTag.createMany({
          data: tagRows,
          skipDuplicates: true,
        });
      }
    });
  }
}

/**
 * ✅ main
 * - seed 파일을 읽고,
 * - tags 먼저, products 나중 순서로 실행
 *
 * tags를 먼저 넣는 이유:
 * - products에서 ProductTag 연결을 만들 때 Tag가 존재해야 연결 가능.
 */
async function main() {
  const tagsPath = path.join(process.cwd(), "seed/seed.tags.json");
  const productsPath = path.join(process.cwd(), "seed/seed.products.json");

  const tagsJson = readJSON<{ tags: SeedTag[] }>(tagsPath);
  const productsJson = readJSON<{ products: SeedProduct[] }>(productsPath);

  console.log("🌱 Seeding tags...");
  await upsertTags(tagsJson.tags);

  console.log("🌱 Seeding products...");
  await upsertProducts(productsJson.products);

  console.log("✅ Done");
}

/**
 * ✅ 실행/에러 처리/정리
 * - prisma.$disconnect()는 Prisma 클라이언트 정리
 * - pool.end()는 pg 커넥션 풀 종료 (이거 안 하면 프로세스가 안 끝나는 경우가 있음)
 */
main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
