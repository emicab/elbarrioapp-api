import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/isAuthenticated'; // Importamos el tipo correcto
import * as ChatService from './chat.service';

export const getConversationsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.user;
        const conversations = await ChatService.getConversationsForUser(userId);
        res.status(200).json(conversations);
    } catch (error) {
        next(error);
    }
};

export const getMessagesController = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { conversationId } = req.params;
        const { page } = req.query;
        // Este endpoint no necesita el userId directamente, pero la ruta está protegida.
        const messages = await ChatService.getMessagesForConversation(conversationId, Number(page) || 1);
        res.status(200).json(messages);
    } catch (error) {
        next(error);
    }
};

export const findOrCreateConversationController = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { userId: userOneId } = req.user; // El usuario actual
        const { friendId: userTwoId } = req.body; // El ID del amigo con el que queremos chatear

        if (!userTwoId) {
            return res.status(400).json({ message: 'El ID del amigo es requerido.' });
        }

        const conversation = await ChatService.findOrCreateConversation(userOneId, userTwoId);
        res.status(200).json({ id: conversation.id }); // Devolvemos solo el ID de la conversación

    } catch (error) {
        next(error);
    }
};

export const getConversationByIdController = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { conversationId } = req.params;
      const { userId } = req.user;
      const conversation = await ChatService.getConversationById(conversationId, userId);
      res.status(200).json(conversation);
    } catch (error) {
      next(error);
    }
};