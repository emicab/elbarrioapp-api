import {BenefitStatus, BenefitUsagePeriod} from '@prisma/client';
import {prisma} from '../../lib/prisma';
import {CreateCompanyData, CreateEventData} from '../../utils/types';
import {uploadImage} from '../users/user.service';
import {format, toZonedTime} from 'date-fns-tz'

/**
 * @param data 
 * @returns Creamos una nueva empresa con un beneficio asociado
 */
export const createBenefit = async (data : {
    title: string;
    description: string;
    companyIdentifier: string;
    usageLimit: number;
    limitPeriod: BenefitUsagePeriod;
    pointCost: number;
    expiresAt?: string;
    categoryIds?: string[];
}) => {
    const company = await prisma.company.findFirst({
        where: {
            OR: [
                {
                    id: data.companyIdentifier
                }, {
                    name: {
                        equals: data.companyIdentifier
                    }
                },
            ]
        }
    });

    if (! company) {
        throw new Error(`No se encontró ninguna empresa con el ID o nombre: "${
            data.companyIdentifier
        }"`);
    }
    // --- MANEJO CORRECTO DE FECHA DE EXPIRACIÓN ---
    let expiresAtDate: Date | null = null;
    if (data.expiresAt) {
        try {
            // Asumimos que la fecha viene como string ISO del frontend
            // Convertimos la fecha UTC recibida a la zona horaria de Argentina
            // (Ajusta 'America/Argentina/Buenos_Aires' si es necesario)
            const timeZone = 'America/Argentina/Buenos_Aires';
            const zonedDate = toZonedTime(new Date(data.expiresAt), timeZone);
            expiresAtDate = zonedDate;
            console.log("Fecha convertida a zona local:", expiresAtDate);
        } catch (e) {
            console.error("Error al parsear la fecha de expiración:", e);
            throw new Error("Formato de fecha de expiración inválido.");
        }
    }
    // --- FIN MANEJO DE FECHA

    // Si se encuentra, creamos el nuevo beneficio incluyendo todos los datos
    const newBenefit = await prisma.benefit.create({
        data: {
            title: data.title,
            description: data.description,
            companyId: company.id,
            usageLimit: data.usageLimit,
            limitPeriod: data.limitPeriod,
            pointCost: data.pointCost,
            expiresAt: expiresAtDate,
            categories: {
                connect: data.categoryIds ?. map(id => ({id}))
            }
        }
    });
    console.log("newBenefit__ ", newBenefit)
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

export const createChannel = async (data : {
    name: string;
    slug: string;
    description?: string;
    isPrivate?: boolean
}) => {
    return prisma.channel.create({data});
};

export const createEvent = async (data : CreateEventData, files? : Express.Multer.File[]) => {
    const {
        organizerId,
        companyId,
        tickets,
        ...eventData
    } = data;

    // Usamos una transacción para asegurar que todo se cree correctamente
    return prisma.$transaction(async (tx) => {
        const imageUrls: string[] = [];
        if (files && files.length > 0) {
            for (const file of files) {
                const url = await uploadImage(file.buffer, 'elbarrioapp_events');
                imageUrls.push(url);
            }
        }

        // 1. Creamos el evento principal
        const newEvent = await tx.event.create({
            data: {
                ...eventData,
                date: new Date(data.date),
                imageUrls: imageUrls,
                organizer: {
                    connect: {
                        id: organizerId
                    }
                },
                company: {
                    connect: {
                        id: companyId
                    }
                },
                latitude: Number(data.latitude),
                longitude: Number(data.longitude)
            }
        });

        console.log("tickets__ ", tickets)
        // 2. Si se proporcionaron tickets, los creamos y los asociamos al nuevo evento
        if (tickets && tickets.length > 0) {
            const ticketTypesData = tickets.map(ticket => ({
                ...ticket,
                currency: ticket.currency,
                eventId: newEvent.id, // Vinculamos cada tipo de ticket al evento recién creado
            }));
            await tx.ticketType.createMany({data: ticketTypesData});
        }

        return newEvent;
    });
};

export const createCompany = async (data : CreateCompanyData, logoBuffer? : Buffer) => {
    let logoUrl: string |undefined = undefined;

    // Si se proporciona un logo, lo subimos a Cloudinary
    if (logoBuffer) {
        logoUrl = await uploadImage(logoBuffer, 'elbarrioapp_companies');
    }

    return prisma.company.create({
        data: {
            ...data,
            logoUrl
        }
    });
};

export const findAllCompanies = async () => {
    return prisma.company.findMany({
        orderBy: {
            name: 'asc'
        }
    });
};

/**
 * @param benefitId - El ID del beneficio a actualizar.
 * @param data - Los nuevos datos del beneficio.
*/
export const updateBenefit = async (benefitId: string, data: any) => {
    let company;
    if (data.companyIdentifier) {
      company = await prisma.company.findFirst({
        where: {
          OR: [
            { id: data.companyIdentifier },
            { name: { equals: data.companyIdentifier, mode: 'insensitive' } },
          ],
        },
      });
      if (!company) {
        throw new Error(`No se encontró empresa con el identificador "${data.companyIdentifier}".`);
      }
    }
  
    // Preparamos los datos para actualizar
    const updateData = {
      title: data.title,
      description: data.description,
      companyId: company ? company.id : undefined,
      status: data.status as BenefitStatus,
      usageLimit: data.usageLimit ? parseInt(data.usageLimit, 10) : undefined,
      limitPeriod: data.limitPeriod as BenefitUsagePeriod,
      pointCost: data.pointCost ? parseInt(data.pointCost, 10) : undefined,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      benefitType: data.benefitType,
      isNew: data.isNew,
      isExclusive: data.isExclusive,
      address: data.address,
      terms: data.terms,
    };
  
    return prisma.benefit.update({
      where: { id: benefitId },
      data: updateData,
    });
  };
  
 /**
  * @param benefitId - El ID del beneficio a eliminar.
  * @returns Una promesa que se resuelve cuando la eliminación es exitosa.
  */
  export const deleteBenefit = async (benefitId: string) => {
    // Opcional: Primero eliminar relaciones si es necesario (ej. BenefitRedemption)
    // Por ahora, el `onDelete: Cascade` del schema debería manejarlo, pero es bueno saberlo.
    
    return prisma.benefit.delete({
      where: { id: benefitId },
    });
  };
