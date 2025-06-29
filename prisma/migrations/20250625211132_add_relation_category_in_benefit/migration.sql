-- CreateTable
CREATE TABLE "_BenefitToCategory" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BenefitToCategory_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_BenefitToCategory_B_index" ON "_BenefitToCategory"("B");

-- AddForeignKey
ALTER TABLE "_BenefitToCategory" ADD CONSTRAINT "_BenefitToCategory_A_fkey" FOREIGN KEY ("A") REFERENCES "Benefit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BenefitToCategory" ADD CONSTRAINT "_BenefitToCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
