import { prisma } from '../../lib/prisma';

// (Opcional) Definir tipos para las entradas, por ahora usamos 'any'
interface CreateEventInput {
  title: string;
  description: string;
  date: string;
  latitude: number;
  longitude: number;
  organizerId: string;
  // ...otros campos
}

interface UpdateEventInput {
  title?: string;
  description?: string;
  date?: string;
  // ...otros campos
}

export const createEvent = async (data: CreateEventInput) => {
  const event = await prisma.event.create({
    data: {
      ...data,
      date: new Date(data.date), // Aseguramos que la fecha sea un objeto Date
    },
  });
  return event;
};

export const findAllEvents = async ( city?: string) => {

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
