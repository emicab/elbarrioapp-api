
import { ClaimedBenefitStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';

/**
 * Valida un token de canje. Esta función se usa tanto para mostrar la página
 * como para verificar el canje final.
 */
export const validateToken = async (token: string) => {
  return prisma.benefitRedemption.findUnique({
    where: {
      token,
      redeemedAt: null, // Que no haya sido canjeado
      expiresAt: { gte: new Date() }, // Y que no haya expirado
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      benefit: {
        include: {
          company: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });
};

/**
 * Marca un token como canjeado y actualiza el estado del beneficio reclamado.
 * Esta función asume que el token ya ha sido validado por el controlador.
 */
export const markTokenAsRedeemed = async (token: string, claimedBenefitId: string | null) => {
  
  // Si el canje no está asociado a un beneficio reclamado, lanzamos un error.
  // Este chequeo es vital.
  if (!claimedBenefitId) {
    throw new Error("Este token de canje no está asociado a un beneficio reclamado.");
  }

  // 2. Ahora, usamos una transacción para garantizar la atomicidad de las escrituras.
  return prisma.$transaction(async (tx) => {
    // Marcamos el token de canje como usado
    const redemption = await tx.benefitRedemption.update({
      where: { token },
      data: { redeemedAt: new Date() },
    });

    // Actualizamos el estado del beneficio reclamado original a 'USED'
    await tx.claimedBenefit.update({
      where: { id: claimedBenefitId }, // Usamos el ID que nos pasó el controlador
      data: { status: 'USED' },
    });

    return redemption; // Devolvemos el registro del canje actualizado
  });
};