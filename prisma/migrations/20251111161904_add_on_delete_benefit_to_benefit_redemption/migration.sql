-- DropForeignKey
ALTER TABLE "BenefitRedemption" DROP CONSTRAINT "BenefitRedemption_benefitId_fkey";

-- AddForeignKey
ALTER TABLE "BenefitRedemption" ADD CONSTRAINT "BenefitRedemption_benefitId_fkey" FOREIGN KEY ("benefitId") REFERENCES "Benefit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
