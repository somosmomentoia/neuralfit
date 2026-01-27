-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "medicalClearanceUrl" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "specialConsiderations" TEXT;

-- AlterTable
ALTER TABLE "WorkoutSession" ADD COLUMN     "sessionName" TEXT;
