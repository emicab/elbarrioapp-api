import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { prisma } from '../lib/prisma'; // Asumo que `prisma` está accesible

let expo = new Expo();

/**
 * [GENÉRICA] Envía una notificación push a un usuario específico.
 * * @param receiverId ID del usuario que debe recibir la notificación.
 * @param title Título de la notificación.
 * @param body Cuerpo o contenido del mensaje.
 * @param data Payload para el Deep Linking (debe contener la ruta a navegar).
 * @param channelId Canal de Android (default: 'default'). Usar 'new-message' para chat/comunidad.
 */
export async function sendPushNotification(
  receiverId: string, 
  title: string, 
  body: string, 
  data: Record<string, any>,
  channelId: string = 'new-message'
) {
  // 1. Buscar el Push Token del usuario receptor
  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
    select: { pushToken: true },
  });

  // Justificación: Verificación de token y existencia.
  if (!receiver || !receiver.pushToken || !Expo.isExpoPushToken(receiver.pushToken)) {
    console.log(`[PUSH] Receptor ${receiverId} sin token válido o permisos denegados.`);
    return;
  }
  
  // 2. Construir el mensaje
  const message: ExpoPushMessage = {
    to: receiver.pushToken,
    sound: 'default',
    title: title,
    body: body.length > 100 ? body.substring(0, 97) + '...' : body, // Truncar cuerpos largos
    data: data,
    // _displayInForeground: true, 
    channelId: channelId, 
  };
  
  // 3. Enviar el mensaje
  try {
    const ticket = await expo.sendPushNotificationsAsync([message]);
    //@ts-ignore
    console.log(`[PUSH] Notificación enviada a ${receiverId}. Ticket ID: ${ticket[0]?.id}`);
    
    // NOTA: En un entorno de producción, es CRÍTICO implementar el manejo de Receipts
    // para procesar errores de tokens expirados y borrarlos de la base de datos.
    
  } catch (error) {
    console.error(`[PUSH] Error al enviar la notificación a ${receiverId}:`, error);
  }
}