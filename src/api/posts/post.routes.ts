import { Router } from 'express';
import { isAuthenticated } from '../../middlewares/isAuthenticated';
import {
  createPostController,
  getAllPostsController,
  addCommentController,
  getCommentsController,
  toggleLikeController,
  getPostByIdController,
  getPostsController,
  deletePostController,
} from './post.controller';
import upload from '../../middlewares/multerUpload';

const router = Router();

// Aplicamos el middleware a todas las rutas de este módulo
// ya que todas las acciones (ver, crear, etc.) requieren autenticación.
router.use(isAuthenticated);

// --- Rutas para Posts ---
// POST /api/posts -> Crear un nuevo post
router.post('/', isAuthenticated, upload.array('images', 3), createPostController);
// GET /api/posts -> Obtener el feed de posts
router.get('/', getPostsController);

// --- Rutas para Comentarios ---
// POST /api/posts/:postId/comments -> Añadir un comentario a un post
router.post('/:postId/comments', addCommentController);

// GET /api/posts/:postId/comments -> Obtener los comentarios de un post
router.get('/:postId', isAuthenticated, getPostByIdController);
router.get('/:postId/comments', getCommentsController);


// --- Ruta para Likes ---
// POST /api/posts/:postId/like -> Dar o quitar like a un post
router.post('/:postId/like', toggleLikeController);

router.delete('/:postId', isAuthenticated, deletePostController);

export default router;
