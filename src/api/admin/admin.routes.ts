import { Router } from 'express';
import { createCompanyController, createBenefitController, createChannelController, createEventController, getAllCompaniesController, updateBenefitController, deleteBenefitController } from './admin.controller';
// import { isAuthenticated } from '../../middlewares/isAuthenticated';
import { isAdmin } from '../../middlewares/isAdmin';
import { isAuthenticated } from '../../middlewares/isAuthenticated';
import upload from '../../middlewares/multerUpload';
import { isProducer } from '../../middlewares/isProducer';

const router = Router();

// POST /api/admin/benefits -> Crear un nuevo beneficio
router.post('/benefits', createBenefitController);

router.post('/channel', isAdmin, createChannelController)
router.post('/events', isAuthenticated, isAdmin, upload.array('images', 2), createEventController);

// --- Rutas de Empresas ---
// POST /api/admin/companies -> Crear una nueva empresa (con logo opcional)
router.post('/companies', upload.single('logo'), isAuthenticated, isAdmin, createCompanyController);

router.put('/benefits/:id', isAuthenticated, isAdmin, updateBenefitController);

// DELETE /api/admin/benefits/:id -> Eliminar un beneficio
router.delete('/benefits/:id', isAuthenticated, isAdmin, deleteBenefitController);

// GET /api/admin/companies -> Obtener una lista de todas las empresas
router.get('/companies', getAllCompaniesController);
export default router;  