import { Router } from 'express';
import { getAllChannelsController } from './channel.controller';
import { isAuthenticated } from '../../middlewares/isAuthenticated';

const router = Router();

/** endpoint para obtener todos los canales */
router.get('/', isAuthenticated, getAllChannelsController);


export default router;