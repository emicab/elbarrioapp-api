import { Request, Response } from 'express';
import { AuthRequest } from '../../middlewares/isAuthenticated';
import * as TicketService from './ticket.service';

export const getUserTicketsController = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(403).json({ message: 'No autenticado.' });

        const tickets = await TicketService.findUserTickets(userId);
        res.status(200).json(tickets);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Controlador para obtener los detalles de una única entrada.
 */
export const getTicketByIdController = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id: ticketId } = req.params;

        if (!userId) return res.status(403).json({ message: 'No autenticado.' });

        const ticket = await TicketService.findTicketByIdForUser(ticketId, userId);
        res.status(200).json(ticket);
    } catch (error: any) {
        res.status(404).json({ message: error.message });
    }
};

export const verifyTicketController = async (req: Request, res: Response) => {
    try {
        const { qrCode } = req.body;
        if (!qrCode) {
            return res.status(400).json({ message: 'El código QR es requerido.' });
        }

        const verificationInfo = {
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        };

        const ticket = await TicketService.verifyTicketByQr(qrCode, verificationInfo);
        res.status(200).json({ status: 'SUCCESS', ticket });
    } catch (error: any) {
        res.status(400).json({ status: 'ERROR', message: error.message });
    }
};