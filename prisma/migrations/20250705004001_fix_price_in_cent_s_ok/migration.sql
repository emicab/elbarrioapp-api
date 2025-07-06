/*
  Warnings:

  - You are about to drop the column `priceInCent` on the `TicketType` table. All the data in the column will be lost.
  - Added the required column `priceInCents` to the `TicketType` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TicketType" DROP COLUMN "priceInCent",
ADD COLUMN     "priceInCents" INTEGER NOT NULL;
