import { Router } from 'express';
import { registerController, loginController } from './auth.controller';

const router = Router();

// Ruta para registrar un nuevo usuario
// POST /api/auth/register
router.post('/register', registerController);

// Ruta para iniciar sesión
// POST /api/auth/login
router.post('/login', loginController);

export default router;