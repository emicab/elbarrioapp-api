import { Router } from 'express';
import { isAuthenticated } from '../../middlewares/isAuthenticated';
import { findOrCreateConversationController, getConversationByIdController, getConversationsController, getMessagesController } from './chat.controller';

const router = Router();
router.use(isAuthenticated);

// Obtener todas mis conversaciones
router.get('/', getConversationsController);
router.get('/:conversationId', getConversationByIdController);
// Obtener los mensajes de una conversación específica
router.get('/:conversationId/messages', getMessagesController);

router.post('/find-or-create', findOrCreateConversationController)

export default router;