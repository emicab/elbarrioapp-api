import { prisma } from '../../lib/prisma';
import { CreateEventData } from '../../utils/types';
import { _getUsageCount } from '../benefits/benefit.service';
import { uploadImage } from '../users/user.service';

interface UpdateEventInput {
  title?: string;
  description?: string;
  date?: string;
  // ...otros campos
}

export const createEvent = async (data: CreateEventData, imageBuffer?: Buffer) => {
  let imageUrls: string[] = [];

  if (imageBuffer) {
    const url = await uploadImage(imageBuffer, 'eventclub_events');
    imageUrls.push(url);
  }

  // --- CORRECCIÓN CLAVE ---
  // Desestructuramos los IDs de las relaciones del resto de los datos.
  const { organizerId, companyId, ...eventData } = data;

  // Verificamos que la compañía pertenezca al organizador para mayor seguridad
  const company = await prisma.company.findFirst({
    where: {
      id: companyId,
      adminId: organizerId, // Solo puede crear eventos para su propia compañía
    },
  });

  if (!company) {
    throw new Error('Compañía no encontrada o no tienes permiso sobre ella.');
  }

  return prisma.event.create({
    data: {
      ...eventData,
      price: Number(data.price) || 0,
      date: new Date(data.date),
      imageUrls: imageUrls,

      // Le decimos a Prisma que conecte las relaciones explícitamente.
      organizer: {
        connect: { id: organizerId },
      },
      company: {
        connect: { id: companyId },
      },

      // Valores temporales para lat/lon
      latitude: Number(data.latitude) || 0,
      longitude: Number(data.longitude) || 0,
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
      }
    }
  });
};

export const findEventById = async (eventId: string) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      organizer: {
        select: { firstName: true, lastName: true, id: true, profile: true }
      }
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
          price: 'asc' // Ordenamos por precio, de más barato a más caro
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