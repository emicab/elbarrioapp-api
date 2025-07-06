import { prisma } from '../../lib/prisma';
import { randomBytes } from 'crypto';

export const createOrderAndTickets = async (
  userId: string,
  ticketTypeId: string,
  quantity: number
) => {
  // Usamos una transacción de Prisma para asegurar que todas las operaciones
  // se completen con éxito, o ninguna lo haga. Esto es crucial.
  return prisma.$transaction(async (tx) => {
    // 1. Verificamos que el tipo de entrada exista y tenga stock suficiente
    const ticketType = await tx.ticketType.findUnique({
      where: { id: ticketTypeId },
    });

    if (!ticketType) throw new Error('Tipo de entrada no válido.');
    if (ticketType.quantity < quantity) throw new Error('No hay suficientes entradas disponibles.');

    // 2. Actualizamos el stock del tipo de entrada
    await tx.ticketType.update({
      where: { id: ticketTypeId },
      data: { quantity: { decrement: quantity } },
    });

    // 3. Creamos la Orden
    const order = await tx.order.create({
      data: {
        userId,
        amount: (ticketType.priceInCents / 100) * quantity,
        status: 'COMPLETED', // Marcamos como completada directamente por ahora
        stripePaymentIntentId: 'simulated_payment_' + new Date().getTime(),
      },
    });

    // 4. Creamos los tickets individuales
    const ticketsData = [];
    for (let i = 0; i < quantity; i++) {
      ticketsData.push({
        qrCode: randomBytes(16).toString('hex'), // Generamos un QR único
        ticketTypeId: ticketTypeId,
        orderId: order.id,
      });
    }
    await tx.ticket.createMany({
      data: ticketsData,
    });

    return order;
  });
};