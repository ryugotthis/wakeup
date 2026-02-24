/**
 * 역할: Prisma(Supabase Postgres) 연결이 정상인지 빠르게 확인하는 **DB 스모크 테스트 스크립트**.
 *
 * - PrismaPg 어댑터로 DATABASE_URL에 연결
 * - 핵심 테이블(tag/product/productTranslation/productTag) 레코드 수(count)를 출력해 시딩/마이그레이션 상태 확인
 * - 샘플 product 1개를 translations + tags(조인)까지 include 해서 데이터 형태가 기대대로 들어갔는지 검증
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const tagCount = await prisma.tag.count();
  const productCount = await prisma.product.count();
  const productTrCount = await prisma.productTranslation.count();
  const productTagCount = await prisma.productTag.count();

  // 네가 질문/결과도 DB로 옮겼다면 아래도 추가
  // const questionCount = await prisma.question.count();
  // const resultCount = await prisma.sktiResultTemplate.count();

  console.log("✅ DB Smoke Test");
  console.log({
    tagCount,
    productCount,
    productTrCount,
    productTagCount,
    // questionCount,
    // resultCount,
  });

  // 샘플: product 1개 가져와서 번역/태그 같이 확인
  const sample = await prisma.product.findFirst({
    include: {
      translations: true,
      tags: { include: { tag: true } },
    },
  });

  console.log("✅ Sample Product:", {
    slug: sample?.slug,
    hsScore: sample?.hsScore,
    translations: sample?.translations?.map((t) => ({
      locale: t.locale,
      name: t.name,
    })),
    tags: sample?.tags?.map((pt) => ({
      code: pt.tag.code,
      priority: pt.priority,
    })),
  });
}

main()
  .catch((e) => {
    console.error("❌ smoke-db failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
