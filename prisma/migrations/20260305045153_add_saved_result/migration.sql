/*
  Warnings:

  - The values [Q18] on the enum `TestQuestionCode` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TestQuestionCode_new" AS ENUM ('Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10', 'Q11', 'Q12', 'Q13', 'Q14', 'Q15', 'Q16', 'Q17', 'TIEBREAKER');
ALTER TABLE "TestQuestion" ALTER COLUMN "code" TYPE "TestQuestionCode_new" USING ("code"::text::"TestQuestionCode_new");
ALTER TYPE "TestQuestionCode" RENAME TO "TestQuestionCode_old";
ALTER TYPE "TestQuestionCode_new" RENAME TO "TestQuestionCode";
DROP TYPE "public"."TestQuestionCode_old";
COMMIT;

-- DropIndex
DROP INDEX "TestResult_userId_key";

-- AlterTable
ALTER TABLE "ShareResult" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "lastViewedAt" TIMESTAMP(3),
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "SavedResult" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "testResultId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestResultRecommendedProduct" (
    "id" UUID NOT NULL,
    "testResultId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "rank" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestResultRecommendedProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedResult_testResultId_idx" ON "SavedResult"("testResultId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedResult_userId_testResultId_key" ON "SavedResult"("userId", "testResultId");

-- CreateIndex
CREATE INDEX "TestResultRecommendedProduct_productId_idx" ON "TestResultRecommendedProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "TestResultRecommendedProduct_testResultId_rank_key" ON "TestResultRecommendedProduct"("testResultId", "rank");

-- CreateIndex
CREATE INDEX "TestResult_userId_idx" ON "TestResult"("userId");

-- AddForeignKey
ALTER TABLE "SavedResult" ADD CONSTRAINT "SavedResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedResult" ADD CONSTRAINT "SavedResult_testResultId_fkey" FOREIGN KEY ("testResultId") REFERENCES "TestResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResultRecommendedProduct" ADD CONSTRAINT "TestResultRecommendedProduct_testResultId_fkey" FOREIGN KEY ("testResultId") REFERENCES "TestResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResultRecommendedProduct" ADD CONSTRAINT "TestResultRecommendedProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
