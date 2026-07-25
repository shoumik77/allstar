-- CreateEnum
CREATE TYPE "WeekStatus" AS ENUM ('OPEN', 'SETTLING', 'CLOSED');

-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'FINAL', 'POSTPONED');

-- CreateEnum
CREATE TYPE "PickType" AS ENUM ('MONEYLINE', 'SPREAD');

-- CreateEnum
CREATE TYPE "TeamSide" AS ENUM ('HOME', 'AWAY');

-- CreateEnum
CREATE TYPE "PickStatus" AS ENUM ('OPEN', 'LOCKED', 'VOID', 'SETTLED');

-- CreateEnum
CREATE TYPE "PositionSide" AS ENUM ('WITH', 'AGAINST');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('STAKE', 'REFUND', 'PAYOUT', 'WEEKLY_RESET');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Week" (
    "id" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "nflWeekNumber" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "WeekStatus" NOT NULL DEFAULT 'OPEN',

    CONSTRAINT "Week_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyBalance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 1000,
    "locked" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WeeklyBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "homeTeam" TEXT NOT NULL,
    "awayTeam" TEXT NOT NULL,
    "kickoff" TIMESTAMP(3) NOT NULL,
    "status" "GameStatus" NOT NULL DEFAULT 'SCHEDULED',
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "homeMoneyline" INTEGER,
    "awayMoneyline" INTEGER,
    "spread" DOUBLE PRECISION,
    "homeSpreadOdds" INTEGER,
    "awaySpreadOdds" INTEGER,
    "oddsUpdatedAt" TIMESTAMP(3),

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pick" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "type" "PickType" NOT NULL,
    "side" "TeamSide" NOT NULL,
    "status" "PickStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "line" DOUBLE PRECISION,
    "snapHomeMoneyline" INTEGER,
    "snapAwayMoneyline" INTEGER,
    "snapSpread" DOUBLE PRECISION,
    "snapHomeSpreadOdds" INTEGER,
    "snapAwaySpreadOdds" INTEGER,
    "sideOdds" INTEGER NOT NULL,
    "fadeOdds" INTEGER NOT NULL,

    CONSTRAINT "Pick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "pickId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "side" "PositionSide" NOT NULL,
    "stake" INTEGER NOT NULL,
    "payout" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "pickId" TEXT,
    "positionId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Week_season_nflWeekNumber_key" ON "Week"("season", "nflWeekNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyBalance_userId_weekId_key" ON "WeeklyBalance"("userId", "weekId");

-- CreateIndex
CREATE UNIQUE INDEX "Game_externalId_key" ON "Game"("externalId");

-- CreateIndex
CREATE INDEX "Game_weekId_idx" ON "Game"("weekId");

-- CreateIndex
CREATE INDEX "Pick_gameId_idx" ON "Pick"("gameId");

-- CreateIndex
CREATE INDEX "Pick_status_idx" ON "Pick"("status");

-- CreateIndex
CREATE INDEX "Position_userId_idx" ON "Position"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Position_pickId_userId_key" ON "Position"("pickId", "userId");

-- CreateIndex
CREATE INDEX "Transaction_userId_weekId_idx" ON "Transaction"("userId", "weekId");

-- AddForeignKey
ALTER TABLE "WeeklyBalance" ADD CONSTRAINT "WeeklyBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyBalance" ADD CONSTRAINT "WeeklyBalance_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pick" ADD CONSTRAINT "Pick_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pick" ADD CONSTRAINT "Pick_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_pickId_fkey" FOREIGN KEY ("pickId") REFERENCES "Pick"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_pickId_fkey" FOREIGN KEY ("pickId") REFERENCES "Pick"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;
