import { Router } from 'express';
import { getBenefitsController, generateQrController, getActiveRedemptionController, getBenefitByIdController } from './benefit.controller';
import { isAuthenticated } from '../../middlewares/isAuthenticated';

const router = Router();

// GET /api/benefits?city=cordoba -> Obtener beneficios por ciudad
router.get('/', isAuthenticated, getBenefitsController);
router.get('/:id', isAuthenticated, getBenefitByIdController);
router.get('/:id/my-redemption', isAuthenticated, getActiveRedemptionController);
// POST /api/benefits/:id/generate-qr -> Generar un token de canje
router.post('/:id/generate-qr', isAuthenticated, generateQrController);


export default router;