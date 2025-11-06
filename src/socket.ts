import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import * as ChatService from './api/chat/chat.service';
import { prisma } from './lib/prisma';

// Exportaremos la instancia 'io' para poder usarla en otras partes de la app
export let io: Server;

export const initSocketServer = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: '*', // En producción, deberías restringir esto al dominio de tu app
      methods: ['GET', 'POST'],
    },
  });

  // El evento 'connection' se dispara cada vez que un cliente se conecta
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Nuevo cliente conectado: ${socket.id}`);

    // Autenticación del socket
    // El cliente debe emitir este evento con su token JWT después de conectarse
    socket.on('authenticate', (token: string) => {
      try {
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error('JWT Secret no definido');

        const decoded = jwt.verify(token, secret) as { userId: string };
        const userId = decoded.userId;
        socket.data.user = {userId} ; // Guardamos el ID del usuario en el socket
        
        if (userId) {
          console.log(`✅ Cliente autenticado: ${socket.id} como usuario ${userId}`);
          // La magia está aquí: hacemos que el socket se una a una sala con su propio ID
          socket.join(userId);
        }
      } catch (error) {
        console.log(`❌ Autenticación de socket fallida para ${socket.id}`);
        socket.disconnect(); // Desconectamos si el token no es válido
      }
    });

    // --- LÓGICA DE CHAT ---

    socket.on('join_conversation', (conversationId) => {
      console.log(`Socket ${socket.id} se unió a la conversación ${conversationId}`);
      socket.join(conversationId);
  });

  socket.on('send_message', async ({ conversationId, text }) => {
    if (!socket.data.user) {
        return socket.emit('send_message_error', { message: 'No estás autenticado.' });
    }
    
    try {
        // ▼▼▼ ¡LA VERIFICACIÓN CLAVE! ▼▼▼
        // Antes de intentar crear el mensaje, verificamos que la conversación realmente existe en la DB.
        const conversationExists = await prisma.conversation.findUnique({
            where: { id: conversationId },
        });

        if (!conversationExists) {
            console.warn(`Intento de enviar mensaje a una conversación inexistente o no lista: ${conversationId}`);
            // Opcional: Podríamos reintentar tras un breve delay, pero por ahora, notificamos el error.
            return socket.emit('send_message_error', { message: 'La sala de chat no está lista. Inténtalo de nuevo.' });
        }

        // Si la conversación existe, procedemos como antes.
        const { userId: senderId } = socket.data.user;
        const newMessage = await ChatService.createMessage(senderId, conversationId, text);
        io.to(conversationId).emit('receive_message', newMessage);

    } catch (error) {
        console.error('Error al enviar mensaje:', error);
        socket.emit('send_message_error', { message: 'No se pudo enviar tu mensaje.' });
    }
});

socket.on('leave_conversation', (conversationId) => {
    socket.leave(conversationId);
});

    socket.on('disconnect', () => {
      console.log(`🔌 Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
};
