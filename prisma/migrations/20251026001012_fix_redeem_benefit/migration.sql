/*
  Warnings:

  - The values [REDEEMED] on the enum `ClaimedBenefitStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `_BenefitRedemptionToClaimedBenefit` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[claimedBenefitId]` on the table `BenefitRedemption` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `claimedBenefitId` to the `BenefitRedemption` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ClaimedBenefitStatus_new" AS ENUM ('AVAILABLE', 'USED', 'EXPIRED');
ALTER TABLE "ClaimedBenefit" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ClaimedBenefit" ALTER COLUMN "status" TYPE "ClaimedBenefitStatus_new" USING ("status"::text::"ClaimedBenefitStatus_new");
ALTER TYPE "ClaimedBenefitStatus" RENAME TO "ClaimedBenefitStatus_old";
ALTER TYPE "ClaimedBenefitStatus_new" RENAME TO "ClaimedBenefitStatus";
DROP TYPE "ClaimedBenefitStatus_old";
ALTER TABLE "ClaimedBenefit" ALTER COLUMN "status" SET DEFAULT 'AVAILABLE';
COMMIT;

-- DropForeignKey
ALTER TABLE "_BenefitRedemptionToClaimedBenefit" DROP CONSTRAINT "_BenefitRedemptionToClaimedBenefit_A_fkey";

-- DropForeignKey
ALTER TABLE "_BenefitRedemptionToClaimedBenefit" DROP CONSTRAINT "_BenefitRedemptionToClaimedBenefit_B_fkey";

-- AlterTable
ALTER TABLE "BenefitRedemption" ADD COLUMN     "claimedBenefitId" TEXT NOT NULL;

-- DropTable
DROP TABLE "_BenefitRedemptionToClaimedBenefit";

-- CreateIndex
CREATE UNIQUE INDEX "BenefitRedemption_claimedBenefitId_key" ON "BenefitRedemption"("claimedBenefitId");

-- AddForeignKey
ALTER TABLE "BenefitRedemption" ADD CONSTRAINT "BenefitRedemption_claimedBenefitId_fkey" FOREIGN KEY ("claimedBenefitId") REFERENCES "ClaimedBenefit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
