import {prisma} from '../../lib/prisma';
import cloudinary from '../../lib/cloudinary';
import { UpdateProfileData } from '../../utils/types';

/**
 * Encuentra un usuario por su ID y devuelve su información completa.
 */
export const findUserById = async (userId: string) => {
  if (!userId) {
    throw new Error('No se proporcionó un ID de usuario.');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      points: true,
      isVerified: true, // Asegurémonos de incluir todos los campos necesarios
      createdAt: true,
      profile: true,
    },
  });

  if (!user) {
    throw new Error('Usuario no encontrado.');
  }
  return user;
};



/**
 * Actualiza o crea el perfil de un usuario.
 * @param userId - El ID del usuario.
 * @param data - Los datos a actualizar (bio y/o avatarUrl).
 */
export const updateUserProfile = async (userId : string, data : UpdateProfileData) => {
    await prisma.user.update({
        where: {
            id: userId
        },
        data: {
            firstName: data.firstName,
            lastName: data.lastName,
        }
    })

    const profile = await prisma.profile.upsert({
        where: {
            userId
        },
        update: {
            nickname: data.nickname,
            bio: data.bio,
            avatarUrl: data.avatarUrl,
            city: data.city,
            hometown: data.hometown,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth.toString()) : undefined,
            showInfo: data.showInfo,
            skills: data.skills,
            jobSeeking: data.jobSeeking,
            cvUrl: data.cvUrl,
        },
        create: {
            userId,
            nickname: data.nickname,
            bio: data.bio,
            avatarUrl: data.avatarUrl,
            city: data.city,
            hometown: data.hometown,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth.toString()) : undefined,
            showInfo: data.showInfo,
            skills: data.skills,
            jobSeeking: data.jobSeeking,
            cvUrl: data.cvUrl
        }
    })
    return findUserById(userId);
};

/**
 * Sube un buffer de imagen a Cloudinary.
 * @param fileBuffer - El buffer del archivo de imagen.
 * @returns La URL segura de la imagen subida.
 */
export const uploadImage = async (fileBuffer : Buffer, folder?: string) : Promise < string > => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream({
            folder: folder ? folder : 'ElBarrioApp_avatars',
            transformation: [
                {
                    width: 300,
                    height: 300,
                    crop: 'fill'
                }
            ]
        }, (error, result) => {
            if (error) 
                return reject(error);
            
            if (result) 
                resolve(result.secure_url);
             else 
                reject(new Error('No se recibió resultado de Cloudinary.'));
            
        });
        uploadStream.end(fileBuffer);
    });
};

export const updateUserAvatar = async (userId: string, avatarUrl: string) => {
  await prisma.profile.upsert({
    where: {userId},
    update: {avatarUrl},
    create: {userId, avatarUrl},
    include: {user: true}
  })
  return findUserById(userId);
}

/**
 * Actualiza el push token de un usuario.
 * @param userId - El ID del usuario.
 * @param token - El Expo Push Token.
 */
export const updatePushToken = async (userId: string, token: string) => {
    return prisma.user.update({
      where: { id: userId },
      data: { pushToken: token },
    });
  };

  export const findUserFavoriteEvents = async (userId: string) => {
    const favorites = await prisma.favoriteEvent.findMany({
      where: { userId },
      orderBy: {
        event: {
          date: 'asc', // Ordenamos los favoritos por la fecha del evento
        },
      },
      include: {
        event: { // Incluimos el objeto completo del evento
          include: { // Anidamos los includes que necesites para la EventCard
            organizer: {
              select: { firstName: true, lastName: true },
            },
            _count: {
              select: { FavoriteEvent: true },
            },
          },
        },
      },
    });
  
    // Mapeamos para devolver solo la información del evento,
    // y añadimos el campo 'isFavoritedByCurrentUser' como true en todos,
    // porque si están en esta lista, por definición son favoritos.
    return favorites.map(fav => ({
      ...fav.event,
      isFavoritedByCurrentUser: true,
    }));
  };

  /**
 * Encuentra el historial de beneficios canjeados por un usuario.
 * @param userId - El ID del usuario.
 */
export const findUserBenefitHistory = async (userId: string) => {
  const redemptions = await prisma.benefitRedemption.findMany({
      where: {
          userId: userId,
          redeemedAt: {
              not: null, // Solo los que han sido canjeados (no solo generados)
          },
      },
      orderBy: {
          redeemedAt: 'desc', // Los más recientes primero
      },
      include: {
          benefit: {
              include: {
                  company: {
                      select: {
                          name: true,
                          logoUrl: true,
                      },
                  },
              },
          },
      },
  });

  // Mapeamos para devolver una estructura más limpia y útil para el frontend
  return redemptions.map(redemption => ({
      ...redemption.benefit,
      redeemedAt: redemption.redeemedAt, // Añadimos la fecha de canje
  }));
};