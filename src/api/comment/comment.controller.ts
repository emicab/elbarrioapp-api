import { Response } from 'express';
import { AuthRequest } from '../../middlewares/isAuthenticated';
import * as CommentService from './comment.service';

export const toggleLikeController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id: commentId } = req.params;

    if (!userId) {
      return res.status(403).json({ message: 'Usuario no autenticado.' });
    }

    const result = await CommentService.toggleLikeOnComment(commentId, userId);
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message.includes("Comment not found")) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};