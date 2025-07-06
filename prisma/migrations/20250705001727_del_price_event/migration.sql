/*
  Warnings:

  - You are about to drop the column `price` on the `Event` table. All the data in the column will be lost.
  - You are about to alter the column `priceInCent` on the `TicketType` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Event" DROP COLUMN "price";

-- AlterTable
ALTER TABLE "TicketType" ALTER COLUMN "priceInCent" SET DATA TYPE INTEGER;
