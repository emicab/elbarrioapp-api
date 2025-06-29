-- CreateEnum
CREATE TYPE "BenefitStatus" AS ENUM ('AVAILABLE', 'EXPIRED');

-- AlterTable
ALTER TABLE "Benefit" ADD COLUMN     "status" "BenefitStatus" NOT NULL DEFAULT 'AVAILABLE';
