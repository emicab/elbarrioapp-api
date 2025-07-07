// En src/api/friends/friend.service.ts

import { prisma } from '../../lib/prisma'; // Asegúrate de que la ruta a tu cliente de Prisma sea correcta
import { FriendshipStatus } from '@prisma/client';

// 1. Enviar una solicitud de amistad
export const sendFriendRequest = async (requesterId: string, addresseeId: string) => {
  // Evitar auto-solicitudes
  if (requesterId === addresseeId) {
    throw new Error('No puedes enviarte una solicitud de amistad a ti mismo.');
  }

  // Comprobar si ya existe una relación (en cualquier dirección)
  const existingFriendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: requesterId, addresseeId: addresseeId },
        { requesterId: addresseeId, addresseeId: requesterId },
      ],
    },
  });

  if (existingFriendship) {
    throw new Error('Ya existe una solicitud de amistad o una amistad con este usuario.');
  }

  return prisma.friendship.create({
    data: {
      requesterId,
      addresseeId,
      status: FriendshipStatus.PENDING,
    },
  });
};

// 2. Aceptar una solicitud de amistad
export const acceptFriendRequest = async (requesterId: string, addresseeId: string) => {
  return prisma.friendship.update({
    where: {
      requesterId_addresseeId: {
        requesterId,
        addresseeId,
      },
      // Condición de seguridad: solo se puede aceptar si el que acepta es el destinatario y está pendiente
      status: FriendshipStatus.PENDING,
    },
    data: {
      status: FriendshipStatus.ACCEPTED,
    },
  });
};

// 3. Rechazar o eliminar una amistad
export const removeFriendship = async (userA_Id: string, userB_Id: string) => {
  // Buscamos la amistad sin importar quién fue el solicitante
  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: userA_Id, addresseeId: userB_Id },
        { requesterId: userB_Id, addresseeId: userA_Id },
      ],
    },
  });

  if (!friendship) {
    throw new Error('No se encontró la relación de amistad.');
  }

  return prisma.friendship.delete({
    where: {
      requesterId_addresseeId: {
        requesterId: friendship.requesterId,
        addresseeId: friendship.addresseeId,
      },
    },
  });
};

// 4. Obtener la lista de solicitudes de amistad pendientes para un usuario
export const getPendingFriendRequests = async (userId: string) => {
  return prisma.friendship.findMany({
    where: {
      addresseeId: userId,
      status: FriendshipStatus.PENDING,
    },
    include: {
      // Incluimos los datos del usuario que envió la solicitud
      requester: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profile: { select: { avatarUrl: true, nickname: true } },
        },
      },
    },
  });
};

// 5. Obtener la lista de amigos aceptados de un usuario
export const getAcceptedFriends = async (userId: string) => {
    const friendships = await prisma.friendship.findMany({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [
          { requesterId: userId },
          { addresseeId: userId },
        ],
      },
      include: {
        requester: { select: { id: true, firstName: true, lastName: true, profile: { select: { avatarUrl: true, nickname: true } } } },
        addressee: { select: { id: true, firstName: true, lastName: true, profile: { select: { avatarUrl: true, nickname: true } } } },
      },
    });
  
    // Mapeamos para devolver solo la información del "otro" usuario
    return friendships.map(f => f.requesterId === userId ? f.addressee : f.requester);
  };

  export const getFriendshipStatus = async (currentUserId: string, profileUserId: string) => {
    // No puede haber estado de amistad con uno mismo.
    if (currentUserId === profileUserId) {
      return { status: 'SELF' }; // Un estado especial para manejar esto en el frontend.
    }
  
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: currentUserId, addresseeId: profileUserId },
          { requesterId: profileUserId, addresseeId: currentUserId },
        ],
      },
    });
  
    // Si no hay ningún registro de amistad, no son amigos.
    if (!friendship) {
      return { status: 'NOT_FRIENDS' };
    }
  
    // Si son amigos aceptados.
    if (friendship.status === FriendshipStatus.ACCEPTED) {
      return { status: 'FRIENDS' };
    }
    
    // Si hay una solicitud pendiente, determinamos quién la envió.
    if (friendship.status === FriendshipStatus.PENDING) {
      if (friendship.requesterId === currentUserId) {
        return { status: 'PENDING_SENT' }; // Yo la envié
      } else {
        return { status: 'PENDING_RECEIVED' }; // Yo la recibí
      }
    }
  
    // Por defecto, si el estado es DECLINED o BLOCKED, los tratamos como si no fueran amigos.
    return { status: 'NOT_FRIENDS' };
  };