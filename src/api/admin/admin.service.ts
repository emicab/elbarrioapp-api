import { BenefitUsagePeriod } from '@prisma/client';
import {prisma} from '../../lib/prisma';

export const createCompany = async (data : {
    name: string;
    city: string;
    logoUrl?: string;
    adminId: string
}) => {
    return prisma.company.create({data});
};

/**
 * 
 * @param data 
 * @returns Creamos una nueva empresa con un beneficio asociado
 */
export const createBenefit = async (data: {
    title: string;
    description: string;
    companyIdentifier: string;
    usageLimit?: number;
    limitPeriod?: BenefitUsagePeriod;
    categoryIds?: string[];
  }) => {
    const company = await prisma.company.findFirst({
      where: {
        OR: [
          { id: data.companyIdentifier },
          { name: { equals: data.companyIdentifier } },
        ],
      },
    });
  
    if (!company) {
      throw new Error(`No se encontró ninguna empresa con el ID o nombre: "${data.companyIdentifier}"`);
    }
  
    // Si se encuentra, creamos el nuevo beneficio incluyendo todos los datos
    const newBenefit = await prisma.benefit.create({
      data: {
        title: data.title,
        description: data.description,
        companyId: company.id,
        // Si se proporcionan los nuevos campos, los guardamos.
        // Si no, Prisma usará los valores por defecto del schema.
        usageLimit: data.usageLimit,
        limitPeriod: data.limitPeriod,
        categories: {
          connect: data.categoryIds?.map(id => ({ id })),
        }
      },
    });
  
    return newBenefit;
  };

/**
 * @returns Obtenemos todos los benficios con sus empresas asociadas
 */
export const getBenefits = async () => {
    return prisma.benefit.findMany({
        include: {
            company: true, // Incluimos la info de la empresa asociada
        },
        orderBy: {
            company: {
                name: 'asc'
            }
        }
    });
};
