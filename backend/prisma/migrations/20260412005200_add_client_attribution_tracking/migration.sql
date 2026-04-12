-- AlterTable
ALTER TABLE "Gym"
ADD COLUMN     "defaultClientAttributionUserId" TEXT;

-- AlterTable
ALTER TABLE "ClientProfile"
ADD COLUMN     "createdByGymId" TEXT,
ADD COLUMN     "createdByUserId" TEXT;

-- AlterTable
ALTER TABLE "Subscription"
ADD COLUMN     "attributedToUserId" TEXT,
ADD COLUMN     "createdByUserId" TEXT;

-- AlterTable
ALTER TABLE "Routine"
ALTER COLUMN "gymId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Gym_defaultClientAttributionUserId_idx" ON "Gym"("defaultClientAttributionUserId");

-- CreateIndex
CREATE INDEX "ClientProfile_createdByUserId_idx" ON "ClientProfile"("createdByUserId");

-- CreateIndex
CREATE INDEX "ClientProfile_createdByGymId_idx" ON "ClientProfile"("createdByGymId");

-- CreateIndex
CREATE INDEX "Subscription_createdByUserId_idx" ON "Subscription"("createdByUserId");

-- CreateIndex
CREATE INDEX "Subscription_attributedToUserId_idx" ON "Subscription"("attributedToUserId");

-- AddForeignKey
ALTER TABLE "Gym" ADD CONSTRAINT "Gym_defaultClientAttributionUserId_fkey" FOREIGN KEY ("defaultClientAttributionUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientProfile" ADD CONSTRAINT "ClientProfile_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientProfile" ADD CONSTRAINT "ClientProfile_createdByGymId_fkey" FOREIGN KEY ("createdByGymId") REFERENCES "Gym"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_attributedToUserId_fkey" FOREIGN KEY ("attributedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
