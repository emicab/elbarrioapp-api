-- DropForeignKey
ALTER TABLE "ClaimedBenefit" DROP CONSTRAINT "ClaimedBenefit_benefitId_fkey";

-- AddForeignKey
ALTER TABLE "ClaimedBenefit" ADD CONSTRAINT "ClaimedBenefit_benefitId_fkey" FOREIGN KEY ("benefitId") REFERENCES "Benefit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
