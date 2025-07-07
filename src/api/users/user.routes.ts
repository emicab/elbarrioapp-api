import { Router } from 'express';
import {
  getMeController,
  getUserByIdController,
  getUserFavoriteEventsController,
  updateMeController,
  updatePushTokenController,
  uploadAvatarController
} from './user.controller';
import { isAuthenticated } from '../../middlewares/isAuthenticated';
import upload from '../../middlewares/multerUpload';

const router = Router();

// --- Rutas Protegidas (requieren un token JWT válido) ---

// GET /api/users/me -> Obtener el perfil del usuario logueado.
router.get('/me', isAuthenticated, getMeController);
router.get('/me/favorite-events', isAuthenticated, getUserFavoriteEventsController);


// PUT /api/users/me -> Actualizar la biografía del usuario logueado.
router.put('/me', isAuthenticated, updateMeController);
router.put('/me/push-token', isAuthenticated, updatePushTokenController);

// POST /api/users/me/avatar -> Subir/actualizar la foto de perfil del usuario logueado.
// Middlewares se ejecutan en orden:
// 1. isAuthenticated: Verifica que el usuario está logueado.
// 2. upload.single('avatar'): Procesa el archivo adjunto con la clave 'avatar'.
// 3. uploadAvatarController: El controlador final recibe la petición procesada.
router.post(
  '/me/avatar',
  isAuthenticated,
  upload.single('avatar'),
  uploadAvatarController
);


// --- Rutas Públicas (no requieren autenticación) ---

// GET /api/users/:id -> Obtener el perfil público de cualquier usuario.
router.get('/:id', getUserByIdController);

export default router;
