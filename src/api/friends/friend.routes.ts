// En src/api/friends/friend.routes.ts
import { Router } from 'express';
import { isAuthenticated } from '../../middlewares/isAuthenticated';
import {
  sendRequestController,
  acceptRequestController,
  removeFriendshipController,
  getPendingRequestsController,
  getFriendsController,
  getStatusController,
} from './friend.controller';

const router = Router();

// Todas las rutas de amigos requieren que el usuario esté autenticado
router.use(isAuthenticated);

// Obtener la lista de amigos aceptados
router.get('/', getFriendsController);

// Obtener las solicitudes de amistad pendientes que he recibido
router.get('/requests', getPendingRequestsController);
router.get('/status/:friendId', getStatusController);

// Enviar una solicitud de amistad a otro usuario
router.post('/request/:addresseeId', sendRequestController);

// Aceptar una solicitud de amistad de otro usuario
router.put('/accept/:requesterId', acceptRequestController);

// Rechazar una solicitud o eliminar un amigo
router.delete('/:friendId', removeFriendshipController);

export default router;