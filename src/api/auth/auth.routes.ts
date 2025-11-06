import { Router } from 'express';
import { registerController, loginController, verifyEmailController } from './auth.controller';
import { validate } from '../../middlewares/validateRequest';
import { loginSchema, registerSchema } from './auth.schema';

const router = Router();

router.get('/verify-email', verifyEmailController);
// Ruta para registrar un nuevo usuario
// POST /api/auth/register
router.post('/register', validate(registerSchema), registerController);
// Ruta para iniciar sesión
// POST /api/auth/login
router.post('/login', validate(loginSchema), loginController);

export default router;