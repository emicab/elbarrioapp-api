// En src/api/friends/friend.controller.ts
import { Request, Response, NextFunction } from 'express';
import * as FriendService from './friend.service';
import { AuthRequest } from '../../middlewares/isAuthenticated';

// Enviar solicitud
export const sendRequestController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId: requesterId } = (req as any).user;
    const { addresseeId } = req.params;
    await FriendService.sendFriendRequest(requesterId, addresseeId);
    res.status(201).json({ message: 'Solicitud de amistad enviada.' });
  } catch (error) {
    next(error);
  }
};

// Aceptar solicitud
export const acceptRequestController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId: addresseeId } = (req as any).user;
    const { requesterId } = req.params;
    await FriendService.acceptFriendRequest(requesterId, addresseeId);
    res.status(200).json({ message: 'Amistad aceptada.' });
  } catch (error) {
    next(error);
  }
};

// Eliminar/Rechazar amistad
export const removeFriendshipController = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId: userA_Id } = (req as any).user;
      const { friendId: userB_Id } = req.params;
      await FriendService.removeFriendship(userA_Id, userB_Id);
      res.status(200).json({ message: 'La relación de amistad ha sido eliminada.' });
    } catch (error) {
      next(error);
    }
  };

// Ver solicitudes pendientes
export const getPendingRequestsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {userId} = (req as any).user;
    const requests = await FriendService.getPendingFriendRequests(userId);
    res.status(200).json(requests);
  } catch (error) {
    next(error);
  }
};

// Ver lista de amigos
export const getFriendsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = (req as any).user;
      const friends = await FriendService.getAcceptedFriends(userId);
      res.status(200).json(friends);
    } catch (error) {
      next(error);
    }
  };

  export const getStatusController = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId: currentUserId } = (req as any).user;
      const { friendId: profileUserId } = req.params;
      
      const status = await FriendService.getFriendshipStatus(currentUserId, profileUserId);
      res.status(200).json(status);

    } catch (error) {
      next(error);
    }
  };