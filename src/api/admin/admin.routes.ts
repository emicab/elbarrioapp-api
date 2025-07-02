import { Router } from 'express';
import { createCompanyController, createBenefitController, createChannelController, createEventController, getAllCompaniesController } from './admin.controller';
// import { isAuthenticated } from '../../middlewares/isAuthenticated';
import { isAdmin } from '../../middlewares/isAdmin';
import { isAuthenticated } from '../../middlewares/isAuthenticated';
import upload from '../../middlewares/multerUpload';
import { isProducer } from '../../middlewares/isProducer';

const router = Router();

// Estas rutas deberían estar protegidas por isAuthenticated e isAdmin
// POST /api/admin/companies -> Crear una nueva empresa

// POST /api/admin/benefits -> Crear un nuevo beneficio
router.post('/benefits', createBenefitController);

router.post('/channel', isAdmin, createChannelController)
router.post('/events', isAuthenticated, isAdmin, upload.array('images', 2), createEventController);

// --- Rutas de Empresas ---
// POST /api/admin/companies -> Crear una nueva empresa (con logo opcional)
router.post('/companies', upload.single('logo'), createCompanyController);

// GET /api/admin/companies -> Obtener una lista de todas las empresas
router.get('/companies', getAllCompaniesController);
export default router;  