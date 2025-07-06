import { Response } from 'express';
import { AuthRequest } from '../../middlewares/isAuthenticated';
import * as OrderService from './order.service';

export const createOrderController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { ticketTypeId, quantity } = req.body;

    if (!userId) return res.status(403).json({ message: 'No autenticado.' });
    if (!ticketTypeId || !quantity) return res.status(400).json({ message: 'Faltan datos requeridos.' });

    const order = await OrderService.createOrderAndTickets(userId, ticketTypeId, quantity);
    res.status(201).json({ message: 'Compra realizada con éxito', order });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};