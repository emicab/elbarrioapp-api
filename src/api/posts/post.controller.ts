import { Response } from 'express';
import { AuthRequest } from '../../middlewares/isAuthenticated';
import * as PostService from './post.service';

export const createPostController = async (req: AuthRequest, res: Response) => {
  try {
    const authorId = req.user?.userId;
    const { content, imageUrl } = req.body;

    if (!authorId) return res.status(403).json({ message: 'Usuario no autenticado.' });
    if (!content) return res.status(400).json({ message: 'El contenido es requerido.' });

    const post = await PostService.createPost(authorId, content, imageUrl);
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