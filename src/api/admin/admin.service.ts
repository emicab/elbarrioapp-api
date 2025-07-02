import { BenefitUsagePeriod } from '@prisma/client';
import {prisma} from '../../lib/prisma';
import { CreateCompanyData, CreateEventData } from '../../utils/types';
import { uploadImage } from '../users/user.service';

/**
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

export const createChannel = async (data: { name: string; slug: string; description?: string; isPrivate?: boolean }) => {
  return prisma.channel.create({ data });
};

export const createEvent = async (data: CreateEventData, files?: Express.Multer.File[]) => {
  const { organizerId, companyId, ...eventData } = data;
  
  const imageUrls: string[] = [];

  // Si hay archivos, los subimos uno por uno
  if (files && files.length > 0) {
    for (const file of files) {
      const url = await uploadImage(file.buffer, 'eventclub_events');
      imageUrls.push(url);
    }
  }

  return prisma.event.create({
    data: {
      ...eventData,
      price: Number(data.price) || 0,
      date: new Date(data.date),
      imageUrls: imageUrls, // Guardamos el array de URLs
      organizer: { connect: { id: organizerId } },
      company: { connect: { id: companyId } },
      latitude: 0,
      longitude: 0,
    },
  });
};

export const createCompany = async (data: CreateCompanyData, logoBuffer?: Buffer) => {
  let logoUrl: string | undefined = undefined;

  // Si se proporciona un logo, lo subimos a Cloudinary
  if (logoBuffer) {
    logoUrl = await uploadImage(logoBuffer, 'eventclub_companies');
  }

  return prisma.company.create({
    data: {
      ...data,
      logoUrl,
    },
  });
};

export const findAllCompanies = async () => {
    return prisma.company.findMany({
        orderBy: { name: 'asc' }
    });
};