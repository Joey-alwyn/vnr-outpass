-- DropForeignKey
ALTER TABLE "GatePass" DROP CONSTRAINT "GatePass_mentorId_fkey";

-- DropForeignKey
ALTER TABLE "GatePass" DROP CONSTRAINT "GatePass_studentId_fkey";

-- AddForeignKey
ALTER TABLE "GatePass" ADD CONSTRAINT "GatePass_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GatePass" ADD CONSTRAINT "GatePass_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
