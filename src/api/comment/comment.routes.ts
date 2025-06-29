import { Router } from 'express';
import { toggleLikeController } from './comment.controller';
import { isAuthenticated } from '../../middlewares/isAuthenticated';

const router = Router();

// POST /api/comments/:id/like -> Dar o quitar like a un comentario
router.post('/:id/like', isAuthenticated, toggleLikeController);

export default router;