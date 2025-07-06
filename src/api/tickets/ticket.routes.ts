import { Router } from 'express';
import { getTicketByIdController, getUserTicketsController, verifyTicketController } from './ticket.controller';
import { isAuthenticated } from '../../middlewares/isAuthenticated';

const router = Router();

// Obtiene todas las entradas del usuario logueado
router.get('/my-tickets', isAuthenticated, getUserTicketsController);

// Obtiene los detalles de una entrada específica
router.get('/:id', isAuthenticated, getTicketByIdController);

// implementar midd STAFF
router.post('/verify', verifyTicketController);
export default router;