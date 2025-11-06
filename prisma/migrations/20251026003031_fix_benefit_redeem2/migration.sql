/*
  Warnings:

  - You are about to drop the column `address` on the `Benefit` table. All the data in the column will be lost.
  - You are about to drop the column `benefitType` on the `Benefit` table. All the data in the column will be lost.
  - You are about to drop the column `isExclusive` on the `Benefit` table. All the data in the column will be lost.
  - You are about to drop the column `isNew` on the `Benefit` table. All the data in the column will be lost.
  - You are about to drop the column `terms` on the `Benefit` table. All the data in the column will be lost.
  - You are about to drop the `_BenefitToCategory` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `pointCost` on table `Benefit` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "ClaimedBenefitStatus" ADD VALUE 'REDEEMED';

-- DropForeignKey
ALTER TABLE "BenefitRedemption" DROP CONSTRAINT "BenefitRedemption_claimedBenefitId_fkey";

-- DropForeignKey
ALTER TABLE "_BenefitToCategory" DROP CONSTRAINT "_BenefitToCategory_A_fkey";

-- DropForeignKey
ALTER TABLE "_BenefitToCategory" DROP CONSTRAINT "_BenefitToCategory_B_fkey";

-- AlterTable
ALTER TABLE "Benefit" DROP COLUMN "address",
DROP COLUMN "benefitType",
DROP COLUMN "isExclusive",
DROP COLUMN "isNew",
DROP COLUMN "terms",
ALTER COLUMN "pointCost" SET NOT NULL,
ALTER COLUMN "pointCost" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "BenefitRedemption" ALTER COLUMN "claimedBenefitId" DROP NOT NULL;

-- DropTable
DROP TABLE "_BenefitToCategory";

-- CreateTable
CREATE TABLE "_BenefitCategories" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BenefitCategories_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_BenefitCategories_B_index" ON "_BenefitCategories"("B");

-- AddForeignKey
ALTER TABLE "BenefitRedemption" ADD CONSTRAINT "BenefitRedemption_claimedBenefitId_fkey" FOREIGN KEY ("claimedBenefitId") REFERENCES "ClaimedBenefit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BenefitCategories" ADD CONSTRAINT "_BenefitCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "Benefit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BenefitCategories" ADD CONSTRAINT "_BenefitCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
