-- AlterTable
ALTER TABLE "Benefit" ADD COLUMN     "address" TEXT,
ADD COLUMN     "benefitType" TEXT,
ADD COLUMN     "isExclusive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isNew" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pointCost" INTEGER;
