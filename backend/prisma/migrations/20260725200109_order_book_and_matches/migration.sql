/*
  Warnings:

  - You are about to drop the column `positionId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the `Position` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "OrderSide" AS ENUM ('WITH', 'AGAINST');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('OPEN', 'PARTIAL', 'FILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MatchResult" AS ENUM ('PENDING', 'WITH_WON', 'AGAINST_WON', 'PUSH');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionType" ADD VALUE 'ORDER_CANCEL';
ALTER TYPE "TransactionType" ADD VALUE 'UNMATCHED_REFUND';

-- DropForeignKey
ALTER TABLE "Position" DROP CONSTRAINT "Position_pickId_fkey";

-- DropForeignKey
ALTER TABLE "Position" DROP CONSTRAINT "Position_userId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_positionId_fkey";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "positionId",
ADD COLUMN     "matchId" TEXT,
ADD COLUMN     "orderId" TEXT;

-- DropTable
DROP TABLE "Position";

-- DropEnum
DROP TYPE "PositionSide";

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "pickId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "side" "OrderSide" NOT NULL,
    "risked" INTEGER NOT NULL,
    "matched" INTEGER NOT NULL DEFAULT 0,
    "refunded" INTEGER NOT NULL DEFAULT 0,
    "limitOdds" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "pickId" TEXT NOT NULL,
    "withOrderId" TEXT NOT NULL,
    "againstOrderId" TEXT NOT NULL,
    "withStake" INTEGER NOT NULL,
    "againstLiability" INTEGER NOT NULL,
    "odds" INTEGER NOT NULL,
    "result" "MatchResult" NOT NULL DEFAULT 'PENDING',
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Order_pickId_side_status_idx" ON "Order"("pickId", "side", "status");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Match_pickId_idx" ON "Match"("pickId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_pickId_fkey" FOREIGN KEY ("pickId") REFERENCES "Pick"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_pickId_fkey" FOREIGN KEY ("pickId") REFERENCES "Pick"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_withOrderId_fkey" FOREIGN KEY ("withOrderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_againstOrderId_fkey" FOREIGN KEY ("againstOrderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;
