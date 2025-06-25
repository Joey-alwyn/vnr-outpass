/*
  Warnings:

  - A unique constraint covering the columns `[qrToken]` on the table `GatePass` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "GatePass" ADD COLUMN     "qrGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "qrToken" TEXT,
ADD COLUMN     "qrValid" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "GatePass_qrToken_key" ON "GatePass"("qrToken");
