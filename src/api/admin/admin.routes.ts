import { Router } from 'express';
import { createCompanyController, createBenefitController } from './admin.controller';
// import { isAuthenticated } from '../../middlewares/isAuthenticated';
// import { isAdmin } from '../../middlewares/isAdmin'; // Necesitaríamos crear este middleware

const router = Router();

// Estas rutas deberían estar protegidas por isAuthenticated e isAdmin
// POST /api/admin/companies -> Crear una nueva empresa
router.post('/companies', createCompanyController);

// POST /api/admin/benefits -> Crear un nuevo beneficio
router.post('/benefits', createBenefitController);

export default router;