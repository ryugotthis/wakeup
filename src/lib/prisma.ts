// src/lib/prisma.ts

/**
 * ✅ PrismaClient
 * - Prisma가 생성해주는 DB Client 클래스
 * - 이걸로 prisma.user.findMany() 같은 DB 쿼리를 실행함
 */
import { PrismaClient } from "@prisma/client";

/**
 * ✅ PrismaPg
 * - Prisma v7부터는 "DB 드라이버"를 기본으로 포함하지 않기 때문에
 *   Postgres를 쓰려면 "어댑터(adapter)"를 PrismaClient 생성 옵션으로 넘겨줘야 함.
 * - 이 어댑터가 실제로 Postgres와 연결하는 방법(드라이버)을 제공해줌.
 */
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * ✅ connectionString
 * - Postgres에 접속하기 위한 URL
 * - 보통 .env 파일에 DATABASE_URL="postgresql://..." 형태로 들어있음
 * - Next.js 서버 환경(서버 컴포넌트/route handler)에서 process.env로 읽을 수 있음
 */
const connectionString = process.env.DATABASE_URL;

/**
 * ✅ 환경 변수 검증 (Fail Fast)
 * - DATABASE_URL이 없으면 DB 연결 자체가 불가능함.
 * - 그래서 앱이 애매하게 돌다가 나중에 터지지 않도록
 *   "시작하자마자" 명확한 에러를 내고 멈추게 함.
 *
 * - 특히 dev 환경에서 .env를 잘못 로드했을 때 바로 원인 파악 가능.
 */
if (!connectionString) {
  throw new Error("Missing DATABASE_URL env var");
}

/**
 * ✅ Postgres 어댑터 생성
 * - PrismaClient에게 넘겨줄 adapter 객체
 * - 이 adapter 안에 "실제 DB 연결 로직"이 들어있다고 보면 됨.
 *
 * - Prisma v7에서는 new PrismaClient({ adapter }) 형태가 필수
 *   (adapter 없이 new PrismaClient() 하면 너가 봤던 InitializationError가 발생)
 */
const adapter = new PrismaPg({ connectionString });

/**
 * ✅ globalThis 캐시를 쓰기 위한 타입 선언
 *
 * - Next.js 개발 모드(dev)에서는 Hot Reload / HMR 때문에
 *   파일이 자주 다시 평가(reload)될 수 있음.
 *
 * - 그때마다 `new PrismaClient()`를 매번 만들면:
 *   1) DB 커넥션이 여러 개 생김
 *   2) "Too many connections" 에러가 날 수 있음
 *   3) dev 환경에서 서버가 불안정해짐
 *
 * - 그래서 전역(globalThis)에 prisma 인스턴스를 "한 번만" 저장해두고
 *   다음 reload에서는 재사용하는 패턴이 흔히 쓰임.
 *
 * - TS에서는 globalThis.prisma 같은 속성이 기본 타입에 없으니
 *   "이 globalThis에 prisma가 있을 수 있다"라고 타입을 덧씌운 것.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

/**
 * ✅ prisma 인스턴스 생성/재사용
 *
 * - globalForPrisma.prisma가 이미 있다면(=이전에 만들어 둔 게 있다면)
 *   그걸 그대로 재사용하고
 *
 * - 없으면(처음 실행) 새로 만든다.
 *
 * ⭐ 여기서 중요한 점:
 * - Prisma v7이라 { adapter }를 반드시 넣어서 생성해야 함.
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

/**
 * ✅ dev 환경에서만 globalThis에 저장
 *
 * - production(배포) 환경에서는 보통 서버 프로세스가 안정적으로 유지되고,
 *   reload가 dev처럼 자주 일어나지 않기 때문에 굳이 global 캐시가 필요 없거나
 *   오히려 환경에 따라 예측이 어려울 수 있어.
 *
 * - 그래서 관례적으로:
 *   - dev에서는 HMR 대비로 global 캐시 사용
 *   - prod에서는 그냥 새로 생성(프로세스당 1개)하는 형태를 많이 씀
 *
 * - 요약:
 *   dev(HMR): "중복 생성 방지" 목적
 *   prod: "단순하고 예측 가능한 실행" 목적
 */
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
