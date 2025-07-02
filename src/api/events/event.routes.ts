import { Router } from 'express';
import { isAuthenticated } from '../../middlewares/isAuthenticated';
import { isProducer } from '../../middlewares/isProducer';
import { 
  createEventController, 
  getAllEventsController, 
  getEventByIdController, 
  getNearbyEventsController 
} from './event.controller';

const router = Router();

// --- Rutas Públicas ---
// Obtener todos los eventos
router.get('/', getAllEventsController);

// Obtener eventos cercanos por geolocalización
router.get('/nearby', getNearbyEventsController);

// Obtener un evento específico por su ID
router.get('/:id', isAuthenticated, getEventByIdController);


// --- Rutas Protegidas (Solo para Productores) ---
// Crear un nuevo evento
router.post('/', isAuthenticated, isProducer, createEventController);

// Actualizar un evento (TODO)
// router.put('/:id', isAuthenticated, isProducer, updateEventController);

// Eliminar un evento (TODO)
// router.delete('/:id', isAuthenticated, isProducer, deleteEventController);


export default router;
