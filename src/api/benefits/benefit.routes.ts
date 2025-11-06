import { Router } from 'express';
import { getBenefitsController, generateQrController, getActiveRedemptionController, getBenefitByIdController, claimBenefitController, getMyClaimedBenefitsController, getClaimedBenefitByIdController } from './benefit.controller';
import { isAuthenticated } from '../../middlewares/isAuthenticated';

const router = Router();

// --- NUEVA RUTA ---
// GET /api/benefits/my-claimed -> Obtiene los beneficios que el usuario ha reclamado y están listos para usar
router.get('/my-claimed', isAuthenticated, getMyClaimedBenefitsController);

// --- NUEVA RUTA ---
// GET /api/benefits/claimed/:id -> Obtiene los detalles de un beneficio reclamado específico
router.get('/claimed/:id', isAuthenticated, getClaimedBenefitByIdController);

// GET /api/benefits?city=cordoba -> Obtener beneficios por ciudad
router.get('/', isAuthenticated, getBenefitsController);
router.get('/:id', isAuthenticated, getBenefitByIdController);
router.get('/:id/my-redemption', isAuthenticated, getActiveRedemptionController);

// --- RUTAS MODIFICADAS Y NUEVAS ---
// POST /api/benefits/:id/claim -> Reclamar un beneficio (gastar puntos, añadirlo a "mis beneficios")
router.post('/:id/claim', isAuthenticated, claimBenefitController);

// --- RUTA MODIFICADA ---
// POST /api/benefits/claimed/:claimedId/generate-qr -> Genera un token de canje para un beneficio YA RECLAMADO
router.post('/claimed/:claimedId/generate-qr', isAuthenticated, generateQrController);


export default router;
