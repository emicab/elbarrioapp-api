import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

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

    socket.on('disconnect', () => {
      console.log(`🔌 Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
};
