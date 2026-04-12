-- DropForeignKey
ALTER TABLE "Routine" DROP CONSTRAINT "Routine_gymId_fkey";

-- AddForeignKey
ALTER TABLE "Routine" ADD CONSTRAINT "Routine_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE SET NULL ON UPDATE CASCADE;
