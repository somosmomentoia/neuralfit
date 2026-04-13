-- AlterTable
ALTER TABLE "User"
ADD COLUMN     "documentNumber" TEXT;

-- AlterTable
ALTER TABLE "Subscription"
ADD COLUMN     "priceOptionId" TEXT,
ADD COLUMN     "monthsCount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "monthlyPriceSnapshot" DOUBLE PRECISION,
ADD COLUMN     "totalPriceSnapshot" DOUBLE PRECISION,
ADD COLUMN     "priceOptionNameSnapshot" TEXT,
ADD COLUMN     "expiredNotifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SubscriptionPriceOption" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "monthlyPrice" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "gymId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPriceOption_pkey" PRIMARY KEY ("id")
);

-- Backfill existing subscriptions using current plan pricing
UPDATE "Subscription" s
SET
    "monthlyPriceSnapshot" = p."price",
    "totalPriceSnapshot" = p."price",
    "priceOptionNameSnapshot" = p."name"
FROM "Plan" p
WHERE s."planId" = p."id"
  AND s."monthlyPriceSnapshot" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_documentNumber_key" ON "User"("documentNumber");

-- CreateIndex
CREATE INDEX "SubscriptionPriceOption_gymId_idx" ON "SubscriptionPriceOption"("gymId");

-- CreateIndex
CREATE INDEX "SubscriptionPriceOption_planId_idx" ON "SubscriptionPriceOption"("planId");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_priceOptionId_fkey" FOREIGN KEY ("priceOptionId") REFERENCES "SubscriptionPriceOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPriceOption" ADD CONSTRAINT "SubscriptionPriceOption_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPriceOption" ADD CONSTRAINT "SubscriptionPriceOption_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
