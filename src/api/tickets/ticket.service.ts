import { prisma } from '../../lib/prisma';

export const findUserTickets = async (userId: string) => {
    // Buscamos todas las órdenes completadas del usuario
    const orders = await prisma.order.findMany({
        where: {
            userId,
            status: 'COMPLETED',
        },
        // Incluimos los tickets y toda la información relevante del evento
        include: {
            tickets: {
                include: {
                    ticketType: {
                        include: {
                            event: {
                                select: {
                                    id: true,
                                    title: true,
                                    date: true,
                                    address: true,
                                    city: true,
                                    imageUrls: true,
                                },
                            },
                        },
                    },
                },
            },

        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    // Aplanamos la estructura para que sea más fácil de consumir en el frontend
    console.log(orders)
    const allTickets = orders.flatMap(order => order.tickets);
    return allTickets;
};

/**
 * Encuentra una entrada específica por su ID, pero solo si pertenece al usuario que la solicita.
 * @param ticketId - El ID de la entrada a buscar.
 * @param userId - El ID del usuario que realiza la petición.
 * @returns El objeto completo de la entrada o null si no se encuentra o no pertenece al usuario.
 */
export const findTicketByIdForUser = async (ticketId: string, userId: string) => {
    const ticket = await prisma.ticket.findFirst({
        where: {
            id: ticketId,
            order: {
                userId: userId, // La condición de seguridad clave
            },
        },
        include: {
            ticketType: {
                include: {
                    event: true, // Incluimos todos los detalles del evento
                },
            },
            order: {
                select: {
                    createdAt: true,
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            },
        },
    });

    if (!ticket) {
        throw new Error('Entrada no encontrada o no tienes permiso para verla.');
    }

    return ticket;
};

/**
* Verifica un ticket por su qrCode y lo marca como usado si es válido.
* @param qrCode - El código único de la entrada.
* @param verificationInfo - Información del dispositivo que realiza el escaneo.
* @returns Los detalles del ticket verificado.
*/
export const verifyTicketByQr = async (
    qrCode: string,
    verificationInfo: { ip: string; userAgent?: string }
) => {
    const ticket = await prisma.ticket.findUnique({
        where: { qrCode },
        include: {
            ticketType: { include: { event: true } },
            order: { include: { user: true } },
        },
    });

    if (!ticket) {
        throw new Error('ENTRADA NO VÁLIDA');
    }
    if (ticket.status === 'USED') {
        throw new Error(`ENTRADA YA UTILIZADA a las ${new Date(ticket.scannedAt!).toLocaleTimeString()}`);
    }
    if (ticket.status !== 'VALID') {
        throw new Error(`ESTADO DE ENTRADA INVÁLIDO: ${ticket.status}`);
    }

    // Si es válida, la actualizamos
    const updatedTicket = await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
            status: 'USED',
            scannedAt: new Date(),
            scannedByIp: verificationInfo.ip,
            scannedByUserAgent: verificationInfo.userAgent,
        },
        include: { // Devolvemos los mismos datos para la respuesta
            ticketType: { include: { event: true } },
            order: { include: { user: true } },
        }
    });

    return updatedTicket;
};