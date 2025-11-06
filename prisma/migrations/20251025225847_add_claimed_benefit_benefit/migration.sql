-- CreateEnum
CREATE TYPE "ClaimedBenefitStatus" AS ENUM ('AVAILABLE', 'REDEEMED');

-- CreateTable
CREATE TABLE "ClaimedBenefit" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ClaimedBenefitStatus" NOT NULL DEFAULT 'AVAILABLE',
    "userId" TEXT NOT NULL,
    "benefitId" TEXT NOT NULL,

    CONSTRAINT "ClaimedBenefit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BenefitRedemptionToClaimedBenefit" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BenefitRedemptionToClaimedBenefit_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClaimedBenefit_userId_benefitId_status_key" ON "ClaimedBenefit"("userId", "benefitId", "status");

-- CreateIndex
CREATE INDEX "_BenefitRedemptionToClaimedBenefit_B_index" ON "_BenefitRedemptionToClaimedBenefit"("B");

-- AddForeignKey
ALTER TABLE "ClaimedBenefit" ADD CONSTRAINT "ClaimedBenefit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimedBenefit" ADD CONSTRAINT "ClaimedBenefit_benefitId_fkey" FOREIGN KEY ("benefitId") REFERENCES "Benefit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BenefitRedemptionToClaimedBenefit" ADD CONSTRAINT "_BenefitRedemptionToClaimedBenefit_A_fkey" FOREIGN KEY ("A") REFERENCES "BenefitRedemption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BenefitRedemptionToClaimedBenefit" ADD CONSTRAINT "_BenefitRedemptionToClaimedBenefit_B_fkey" FOREIGN KEY ("B") REFERENCES "ClaimedBenefit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
