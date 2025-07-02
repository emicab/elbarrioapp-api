import { prisma } from "../../lib/prisma"

/**
 * 
 * @returns Obtiene todos los canales.
 */
export const findAllChannels = () => {
    return prisma.channel.findMany({
        orderBy: {
            name: 'asc'
        }
    })
}

export const findAllChannelsForUser = async (userId: string) => {
    return prisma.channel.findMany({
      where: {
        OR: [
          { isPrivate: false }, // Devuelve todos los canales públicos
          { members: { some: { userId: userId, status: 'MEMBER' } } } // O los privados donde el usuario es miembro
        ]
      },
      orderBy: { name: 'asc' }
    });
  };