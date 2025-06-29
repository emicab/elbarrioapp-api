import { prisma } from '../../lib/prisma';

export const validateToken = async (token: string) => {
  const redemption = await prisma.benefitRedemption.findUnique({
    where: { token, redeemedAt: null, expiresAt: { gte: new Date() } },
    include: { benefit: { include: { company: true } }, user: true },
  });
  return redemption;
};

export const markTokenAsRedeemed = async (token: string) => {
  return prisma.benefitRedemption.update({
    where: { token },
    data: { redeemedAt: new Date() },
  });
};