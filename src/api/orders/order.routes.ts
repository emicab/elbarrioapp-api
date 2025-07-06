import { Router } from 'express';
import { createOrderController } from './order.controller';
import { isAuthenticated } from '../../middlewares/isAuthenticated';

const router = Router();

router.post('/', isAuthenticated, createOrderController);

export default router;