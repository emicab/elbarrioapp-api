/*
  Warnings:

  - The values [ONCE_ONLY] on the enum `BenefitUsagePeriod` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BenefitUsagePeriod_new" AS ENUM ('LIFETIME', 'DAILY', 'WEEKLY', 'MONTHLY');
ALTER TABLE "Benefit" ALTER COLUMN "limitPeriod" DROP DEFAULT;
ALTER TABLE "Benefit" ALTER COLUMN "limitPeriod" TYPE "BenefitUsagePeriod_new" USING ("limitPeriod"::text::"BenefitUsagePeriod_new");
ALTER TYPE "BenefitUsagePeriod" RENAME TO "BenefitUsagePeriod_old";
ALTER TYPE "BenefitUsagePeriod_new" RENAME TO "BenefitUsagePeriod";
DROP TYPE "BenefitUsagePeriod_old";
ALTER TABLE "Benefit" ALTER COLUMN "limitPeriod" SET DEFAULT 'LIFETIME';
COMMIT;

-- AlterTable
ALTER TABLE "Benefit" ALTER COLUMN "limitPeriod" SET DEFAULT 'LIFETIME';
