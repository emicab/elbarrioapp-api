-- CreateEnum
CREATE TYPE "ChannelMembershipStatus" AS ENUM ('MEMBER', 'PENDING', 'BLOCKED');

-- CreateTable
CREATE TABLE "ChannelMembership" (
    "userId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "status" "ChannelMembershipStatus" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChannelMembership_pkey" PRIMARY KEY ("userId","channelId")
);

-- AddForeignKey
ALTER TABLE "ChannelMembership" ADD CONSTRAINT "ChannelMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelMembership" ADD CONSTRAINT "ChannelMembership_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
