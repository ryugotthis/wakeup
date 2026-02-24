-- CreateEnum
CREATE TYPE "TestQuestionCode" AS ENUM ('Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10', 'Q11', 'Q12', 'Q13', 'Q14', 'Q15', 'Q16', 'Q17', 'Q18', 'TIEBREAKER');

-- CreateTable
CREATE TABLE "TestQuestion" (
    "id" UUID NOT NULL,
    "code" "TestQuestionCode" NOT NULL,
    "order" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "isTiebreaker" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestQuestionTranslation" (
    "id" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "locale" "Locale" NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "TestQuestionTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestChoice" (
    "id" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "order" INTEGER NOT NULL,
    "key" TEXT NOT NULL,

    CONSTRAINT "TestChoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestChoiceTranslation" (
    "id" UUID NOT NULL,
    "choiceId" UUID NOT NULL,
    "locale" "Locale" NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "TestChoiceTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestChoiceImpact" (
    "id" UUID NOT NULL,
    "choiceId" UUID NOT NULL,
    "skinType" "SkinTypeCode" NOT NULL,
    "delta" DOUBLE PRECISION NOT NULL DEFAULT 1,

    CONSTRAINT "TestChoiceImpact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TestQuestion_code_key" ON "TestQuestion"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TestQuestion_order_key" ON "TestQuestion"("order");

-- CreateIndex
CREATE INDEX "TestQuestionTranslation_locale_idx" ON "TestQuestionTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "TestQuestionTranslation_questionId_locale_key" ON "TestQuestionTranslation"("questionId", "locale");

-- CreateIndex
CREATE INDEX "TestChoice_questionId_idx" ON "TestChoice"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "TestChoice_questionId_order_key" ON "TestChoice"("questionId", "order");

-- CreateIndex
CREATE INDEX "TestChoiceTranslation_locale_idx" ON "TestChoiceTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "TestChoiceTranslation_choiceId_locale_key" ON "TestChoiceTranslation"("choiceId", "locale");

-- CreateIndex
CREATE INDEX "TestChoiceImpact_skinType_idx" ON "TestChoiceImpact"("skinType");

-- CreateIndex
CREATE UNIQUE INDEX "TestChoiceImpact_choiceId_skinType_key" ON "TestChoiceImpact"("choiceId", "skinType");

-- AddForeignKey
ALTER TABLE "TestQuestionTranslation" ADD CONSTRAINT "TestQuestionTranslation_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "TestQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestChoice" ADD CONSTRAINT "TestChoice_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "TestQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestChoiceTranslation" ADD CONSTRAINT "TestChoiceTranslation_choiceId_fkey" FOREIGN KEY ("choiceId") REFERENCES "TestChoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestChoiceImpact" ADD CONSTRAINT "TestChoiceImpact_choiceId_fkey" FOREIGN KEY ("choiceId") REFERENCES "TestChoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
