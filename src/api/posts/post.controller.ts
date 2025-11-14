import { Response } from 'express';
import { AuthRequest } from '../../middlewares/isAuthenticated';
import * as PostService from './post.service';
import { User } from '@prisma/client';
import { prisma } from '../../lib/prisma';

export const createPostController = async (req: AuthRequest, res: Response) => {
  try {
    const authorId = req.user?.userId;
    const files = req.files as Express.Multer.File[] | undefined;
    const { content, channelId, eventId } = req.body;

    if (!authorId) {
      return res.status(403).json({ message: 'Usuario no autenticado.' });
    }
    if (!content) {
      return res.status(400).json({ message: 'El contenido es requerido.' });
    }
    // Añadimos una validación para el channelId
    if (!channelId) {
        return res.status(400).json({ message: 'Se debe seleccionar un canal para publicar.' });
    }

    const post = await PostService.createPost(authorId, content, files, channelId, eventId);
    res.status(201).json(post);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllPostsController = async (req: AuthRequest, res: Response) => {
  try {
    const posts = await PostService.findAllPosts();
    res.status(200).json(posts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addCommentController = async (req: AuthRequest, res: Response) => {
    try {
        const authorId = req.user?.userId;
        const { postId } = req.params;
        const { text } = req.body;

        if (!authorId) return res.status(403).json({ message: 'Usuario no autenticado.' });
        if (!text) return res.status(400).json({ message: 'El texto del comentario es requerido.' });

        const comment = await PostService.addCommentToPost(postId, authorId, text);
        res.status(201).json(comment);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

export const getCommentsController = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { postId } = req.params;

        if (!userId) return res.status(403).json({ message: 'Usuario no autenticado.' });

        const comments = await PostService.findCommentsForPost(postId, userId);
        res.status(200).json(comments);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

export const toggleLikeController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { postId } = req.params;

    if (!userId) return res.status(403).json({ message: 'Usuario no autenticado.' });

    const result = await PostService.toggleLikeOnPost(postId, userId);
    res.status(200).json(result);
  } catch (error: any) {
    // Manejar el caso en que el post no exista
    if (error.code === 'P2003') { // Foreign key constraint failed
        return res.status(404).json({ message: 'Post no encontrado.' });
    }
    res.status(500).json({ message: error.message });
  }
};

export const getPostByIdController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { postId } = req.params;

    if (!userId) {
      return res.status(403).json({ message: 'Usuario no autenticado.' });
    }

    const post = await PostService.findPostByIdForUser(postId, userId);
    res.status(200).json(post);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const getPostsController = async (req: AuthRequest, res: Response) => {
  try {
      const userId = req.user?.userId;
      const { channelSlug, eventId } = req.query; // Obtenemos el slug del canal desde la query

      if (!userId) {
          return res.status(403).json({ message: 'Usuario no autenticado.' });
      }
      
      // Un console.log para depurar y ver qué estamos recibiendo
      console.log(`Fetching posts for channel: ${channelSlug || 'todos'}`);

      const posts = await PostService.findAllPostsForUser(
        userId, 
        channelSlug as string | undefined,
        eventId as string | undefined
      );
      res.status(200).json(posts);

  } catch (error: any) {
      res.status(500).json({ message: error.message });
  }
};

/**
 * Controlador para eliminar una publicación.
 */
export const deletePostController = async (req: AuthRequest, res: Response) => {
  try {
    const requestingUserId = req.user?.userId; // Obtenemos solo el ID desde el token
    const { postId } = req.params;

    if (!requestingUserId) {
      return res.status(403).json({ message: 'Usuario no autenticado.' });
    }

    
    // Buscamos el objeto de usuario completo y actualizado en la base de datos.
    const currentUser = await prisma.user.findUnique({ where: { id: requestingUserId } });

    if (!currentUser) {
      return res.status(404).json({ message: 'El usuario que realiza la acción no fue encontrado.' });
    }

    // Ahora pasamos el objeto de usuario completo y seguro al servicio.
    await PostService.deletePost(postId, currentUser);
    res.status(200).json({ success: true, message: 'Publicación eliminada.' });
  } catch (error: any) {
    res.status(403).json({ message: error.message });
  }
};