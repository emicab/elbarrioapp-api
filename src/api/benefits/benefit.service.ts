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
 */
export const generateRedemptionToken = async (benefitId : string, userId : string) => {
    const benefit = await prisma.benefit.findUnique({
        where: {
            id: benefitId
        }
    });

    if (! benefit || benefit.status !== 'AVAILABLE') {
        throw new Error('Este beneficio no está disponible.');
    }

    // Usamos la misma función auxiliar para verificar los límites
    const usageCount = await _getUsageCount(benefit, userId);

    if (usageCount >= benefit.usageLimit) {
        let errorMessage = 'Límite de uso alcanzado para este beneficio.';
        if (benefit.limitPeriod === 'DAILY') 
            errorMessage = 'Ya has usado este beneficio hoy. Vuelve a intentarlo mañana.';
        
        if (benefit.limitPeriod === 'WEEKLY') 
            errorMessage = 'Ya has usado este beneficio esta semana.';
        
        if (benefit.limitPeriod === 'MONTHLY') 
            errorMessage = 'Ya has usado este beneficio este mes.';
        
        throw new Error(errorMessage);
    }

    const token = randomBytes(20).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    return prisma.benefitRedemption.create({
        data: {
            token,
            expiresAt,
            benefitId,
            userId
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
