// En src/api/chat/chat.service.ts

import { prisma } from '../../lib/prisma';

// 1. Encontrar una conversación 1 a 1 existente o crear una nueva
export const findOrCreateConversation = async (userOneId: string, userTwoId: string) => {
  // Busca una conversación donde ambos usuarios sean los únicos participantes
  let conversation = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { id: userOneId } } },
        { participants: { some: { id: userTwoId } } },
        { participants: { every: { id: { in: [userOneId, userTwoId] } } } },
      ],
    },
  });

  // Si no existe, la crea
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        participants: {
          connect: [{ id: userOneId }, { id: userTwoId }],
        },
      },
    });
  }
  return conversation;
};

// 2. Obtener todas las conversaciones de un usuario
export const getConversationsForUser = async (userId: string) => {
  return prisma.conversation.findMany({
    where: {
      participants: {
        some: { id: userId },
      },
    },
    include: {
      // Incluimos los participantes para saber con quién es la conversación
      participants: {
        where: { NOT: { id: userId } }, // Excluimos al propio usuario
        select: { id: true, firstName: true, profile: { select: { avatarUrl: true } } },
      },
      // Incluimos el último mensaje para la vista previa
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });
};

// 3. Obtener los mensajes de una conversación específica (con paginación)
export const getMessagesForConversation = async (conversationId: string, page = 1, limit = 30) => {
  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: (page - 1) * limit,
    include: {
      sender: {
        select: { id: true, firstName: true },
      },
    },
  });
};

// 4. Crear un nuevo mensaje (esta función la llamaremos desde Socket.IO)
export const createMessage = async (senderId: string, conversationId: string, text: string) => {
  return prisma.message.create({
    data: {
      text,
      senderId,
      conversationId,
    },
    include: { // Devolvemos el mensaje con la info del sender para retransmitirlo
      sender: {
        select: { id: true, firstName: true, profile: { select: { avatarUrl: true } } },
      },
    },
  });
};

export const getConversationById = async (conversationId: string, userId: string) => {
  return prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: {
        where: { NOT: { id: userId } }, // Devolvemos solo al otro participante
        select: { id: true, firstName: true, profile: { select: { avatarUrl: true } } },
      },
    },
  });
};