import {Benefit} from '@prisma/client';
import {prisma} from '../../lib/prisma';
import {randomBytes} from 'crypto';

/**
 * Función auxiliar privada para centralizar la lógica de conteo de usos.
 * No se exporta porque solo se usa dentro de este servicio.
 * @param benefit - El objeto completo del beneficio.
 * @param userId - El ID del usuario.
 * @returns El número de veces que el usuario ha canjeado el beneficio en el período actual.
 */
export const _getUsageCount = async (benefit : Benefit, userId : string) : Promise < number > => {
    let sinceDate: Date |undefined;

    switch (benefit.limitPeriod) {
        case 'DAILY': sinceDate = new Date();
            sinceDate.setHours(0, 0, 0, 0); // Desde el inicio del día de hoy
            break;
        case 'WEEKLY':
            const today = new Date();
            const firstDayOfWeek = today.getDate() - today.getDay();
            sinceDate = new Date(today.setDate(firstDayOfWeek));
            sinceDate.setHours(0, 0, 0, 0); // Desde el inicio de la semana
            break;
        case 'MONTHLY': sinceDate = new Date();
            sinceDate.setDate(1); // Desde el inicio del mes actual
            sinceDate.setHours(0, 0, 0, 0);
            break;
        case 'LIFETIME':
            // Para LIFETIME, no definimos 'sinceDate', así la consulta contará todos los canjes históricos.
            break;
    }

    return prisma.benefitRedemption.count({
        where: {
          benefitId: benefit.id,
          userId,
          redeemedAt: { not: null, gte: sinceDate },
        },
      });
};

export const findBenefitsByCity = async (city : string) => {
    return prisma.benefit.findMany({
        where: {
            company: {
                city: city
            }
        },
        include: {
            company: {
                select: {
                    name: true,
                    logoUrl: true
                }
            }
        }
    });
};

export const findBenefitsByCityForUser = async (city : string, userId : string, categoryName? : string) => { // 1. Prepara el filtro base
    const whereClause: any = {
        company: {
            city: {
                equals: city,
                
            },
            
        },
        status: 'AVAILABLE'
    };

    // 2. Si llega un categoryName, lo añade dinámicamente al filtro
    if (categoryName) {
        whereClause.categories = {
            some: {
                name: {
                    equals: categoryName
                }
            }
        };
    }

    const benefits = await prisma.benefit.findMany({
        where: whereClause,
        include: {
            company: {
                select: {
                    name: true,
                    logoUrl: true
                }
            }
        }
    });

    const redemptions = await prisma.benefitRedemption.findMany({
        where: {
            userId,
            benefitId: {
                in: benefits.map(b => b.id)
            },
            redeemedAt: {
                not: null
            }
        },
        select: {
            benefitId: true
        }
    });

    const redeemedBenefitIds = new Set(redemptions.map(r => r.benefitId));

    return benefits.map(benefit => ({
        ...benefit,
        // La UI ahora sabrá si mostrar la etiqueta "Usado"
        isUsed: redeemedBenefitIds.has(benefit.id)
    }));
};

/**
 * Verifica los límites y genera un token de canje si el usuario puede usar el beneficio.
 * --- MODIFICADO: Ahora recibe claimedId en lugar de benefitId ---
 */
export const generateRedemptionToken = async (claimedId: string, userId: string) => {
    // 1. VERIFICAMOS QUE EL BENEFICIO HAYA SIDO RECLAMADO Y ESTÉ LISTO PARA USAR
    const claimedBenefit = await prisma.claimedBenefit.findUnique({
        where: {
            id: claimedId,
            userId: userId, // Condición de seguridad extra
            status: 'AVAILABLE' // Solo se puede usar si está disponible
        },
        include: { benefit: true }
    });

    if (!claimedBenefit) {
        throw new Error('Beneficio no encontrado, no te pertenece o ya ha sido utilizado.');
    }

    const { benefit, benefitId } = claimedBenefit;

    // 2. VERIFICAMOS LÍMITES DE USO (diario, semanal, etc.)
    const usageCount = await _getUsageCount(benefit, userId);
    if (usageCount >= benefit.usageLimit) {
        throw new Error('Has alcanzado el límite de uso para este beneficio.');
    }

    // 3. GENERAMOS EL TOKEN DE CANJE DE UN SOLO USO
    const token = randomBytes(20).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos de validez

    return prisma.benefitRedemption.create({
        data: {
            token,
            expiresAt,
            benefit: { connect: { id: benefit.id } },
            user: { connect: { id: userId } },
            claimedBenefit: { connect: { id: claimedBenefit.id } },
        }
    });
};

export const findActiveRedemptionForUser = async (benefitId : string, userId : string) => {
    return prisma.benefitRedemption.findFirst({
        where: {
            benefitId,
            userId,
            redeemedAt: null, // Que no haya sido canjeado
            expiresAt: {
                gte: new Date()
            }, // Y que no haya expirado
        }
    });
};

export const findBenefitDetailsForUser = async (benefitId : string, userId : string) => {
    const benefit = await prisma.benefit.findUnique({
        where: {
            id: benefitId
        },
        include: {
            company: true
        }
    });

    if (! benefit) {
        throw new Error('Beneficio no encontrado.');
    }

    // Usamos la función auxiliar para obtener el conteo
    const timesUsed = await _getUsageCount(benefit, userId);

    return {
        ... benefit,
        timesUsed,
        isUsed: timesUsed >= benefit.usageLimit
    };
};


// --- NUEVO SERVICIO ---
/**
 * Reclama un beneficio para un usuario, descuenta puntos y lo marca como 'AVAILABLE'.
 */
export const claimBenefitForUser = async (benefitId: string, userId: string) => {
    return prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId } });
        const benefit = await tx.benefit.findUnique({ where: { id: benefitId } });

        if (!user || !benefit) {
            throw new Error('Usuario o beneficio no encontrado.');
        }

        // 1. Verificar si el usuario tiene suficientes puntos
        if (user.points < benefit.pointCost) {
            throw new Error('No tienes suficientes puntos para reclamar este beneficio.');
        }

        // 2. Verificar si el beneficio ya ha sido reclamado y está disponible
        const existingClaim = await tx.claimedBenefit.findFirst({
            where: { userId, benefitId, status: 'AVAILABLE' }
        });

        if (existingClaim) {
            throw new Error('Ya has reclamado este beneficio y está listo para usar.');
        }

        // 3. Descontar los puntos al usuario
        await tx.user.update({
            where: { id: userId },
            data: { points: { decrement: benefit.pointCost } }
        });

        // 4. Crear el registro del beneficio reclamado
        const claimedBenefit = await tx.claimedBenefit.create({
            data: {
                userId,
                benefitId,
                status: 'AVAILABLE' // Lo marca como listo para usar
            }
        });

        return claimedBenefit;
    });
};


// --- NUEVO SERVICIO ---
/**
 * Encuentra todos los beneficios que un usuario ha reclamado y están listos para usar.
 */
export const findClaimedBenefitsForUser = async (userId: string) => {
    const claimed = await prisma.claimedBenefit.findMany({
        where: {userId, status: 'AVAILABLE'},
        include: {
            benefit: { // Incluimos la información completa del beneficio original
                include: {
                    company: {
                        select: {
                            name: true,
                            logoUrl: true
                        }
                    }
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    // Devolvemos una lista que es fácil de consumir para el frontend
    return claimed.map(c => ({
        ...c.benefit,
        claimedStatus: c.status,
        claimedId: c.id // Pasamos el ID del reclamo por si se necesita
    }));
};


// --- NUEVO SERVICIO ---
/**
 * Encuentra los detalles de un beneficio reclamado específico.
 */
export const findClaimedBenefitById = async (claimedId: string, userId: string) => {
    const claimedBenefit = await prisma.claimedBenefit.findFirst({
        where: {
            id: claimedId,
            userId, // Condición de seguridad para que solo el dueño pueda verlo
        },
        include: {
            benefit: {
                include: {
                    company: true,
                },
            },
        },
    });

    if (!claimedBenefit) {
        throw new Error("Beneficio reclamado no encontrado o no te pertenece.");
    }

    return claimedBenefit;
};