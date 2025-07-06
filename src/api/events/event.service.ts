import { prisma } from '../../lib/prisma';
import { _getUsageCount } from '../benefits/benefit.service';
import { uploadImage } from '../users/user.service';

interface UpdateEventInput {
  title?: string;
  description?: string;
  date?: string;
  // ...otros campos
}

type CreateEventData = {
  title: string;
  description: string;
  date: string;
  city: string;
  address: string;
  price?: number;
  organizerId: string;
  companyId: string;
  latitude: number;
  longitude: number;
};

export const createEvent = async (data: CreateEventData, files?: Express.Multer.File[]) => {
  // Desestructuramos los IDs de las relaciones y los datos del evento
  const { organizerId, companyId, ...eventData } = data;

  // Verificación de seguridad: Asegurarnos de que el productor solo pueda
  // crear eventos para una compañía que le pertenece.
  const company = await prisma.company.findFirst({
    where: {
      id: companyId,
      adminId: organizerId, // El organizador debe ser el admin de la compañía
    },
  });

  if (!company) {
    throw new Error('Compañía no encontrada o no tienes permiso para crear eventos para ella.');
  }

  let imageUrls: string[] = [];
  if (files && files.length > 0) {
    for (const file of files) {
      const url = await uploadImage(file.buffer, 'eventclub_events');
      imageUrls.push(url);
    }
  }

  // Usamos la sintaxis `connect` para establecer las relaciones correctamente
  return prisma.event.create({
    data: {
      ...eventData,
      date: new Date(data.date),
      imageUrls: imageUrls,
      organizer: {
        connect: { id: organizerId },
      },
      company: {
        connect: { id: companyId },
      },
    },
  });
};

export const findAllEvents = async (city?: string) => {

  const whereClause = city ? { city: city } : {};

  // Aquí se podrían añadir filtros por ciudad, categoría, etc.
  return await prisma.event.findMany({
    where: whereClause,
    orderBy: {
      date: 'asc',
    },
    include: {
      organizer: {
        select: { firstName: true, lastName: true, id: true }
      },
      company: {
        select: { name: true, id: true }
      },
      tickets: true
    }
  });
};

export const findEventById = async (eventId: string) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      organizer: {
        select: { firstName: true, lastName: true, id: true, profile: true }
      },
      tickets: true
    }
  });
  if (!event) throw new Error('Evento no encontrado');
  return event;
};

export const updateEvent = async (eventId: string, data: UpdateEventInput) => {
  return await prisma.event.update({
    where: { id: eventId },
    data: data,
  });
};

export const deleteEvent = async (eventId: string) => {
  return await prisma.event.delete({
    where: { id: eventId },
  });
};

export const findEventsNearby = async (lat: number, lon: number, radiusInKm: number) => {
  const radiusInMeters = radiusInKm * 1000;

  // NOTA: Esta es una consulta SQL nativa que utiliza PostGIS.
  // Es la forma más eficiente de realizar búsquedas geoespaciales.
  // Asegúrate de que tu base de datos PostgreSQL tenga la extensión PostGIS habilitada.
  // Para habilitarla: CREATE EXTENSION postgis;

  const events = await prisma.$queryRaw`
    SELECT id, title, date, latitude, longitude,
           ST_Distance(
             ST_MakePoint(longitude, latitude)::geography,
             ST_MakePoint(${lon}, ${lat})::geography
           ) as distance
    FROM "Event"
    WHERE ST_DWithin(
      ST_MakePoint(longitude, latitude)::geography,
      ST_MakePoint(${lon}, ${lat})::geography,
      ${radiusInMeters}
    )
    ORDER BY distance ASC;
  `;

  return events;
};

export const findEventByIdForUser = async (eventId: string, userId: string) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      organizer: { 
        select: 
          { 
            firstName: true, 
            lastName: true, 
            id: true, 
            profile: {
              select: {
                avatarUrl: true,
                phone: true
              }
            }
          } 
        },
      company: { select: { name: true, logoUrl: true } },
      benefits: true,
      // INCLUSIÓN CLAVE: Traemos los tipos de entradas asociados al evento.
      tickets: {
        orderBy: {
          priceInCents: 'asc' // Ordenamos por precio, de más barato a más caro
        }
      }
    }
  });

  if (!event) {
    throw new Error('Evento no encontrado.');
  }

  const benefitsWithUsage = await Promise.all(
    event.benefits.map(async (benefit) => {
      const timesUsed = await _getUsageCount(benefit, userId);
      return {
        ...benefit, // Mantenemos todos los datos del beneficio
        isUsed: timesUsed >= benefit.usageLimit,
      };
    })
  );

  return {
    ...event,
    benefits: benefitsWithUsage,
  };
};