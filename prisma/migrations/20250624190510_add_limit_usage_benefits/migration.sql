-- CreateEnum
CREATE TYPE "BenefitUsagePeriod" AS ENUM ('ONCE_ONLY', 'DAILY', 'WEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "Benefit" ADD COLUMN     "limitPeriod" "BenefitUsagePeriod" NOT NULL DEFAULT 'ONCE_ONLY',
ADD COLUMN     "usageLimit" INTEGER NOT NULL DEFAULT 1;
