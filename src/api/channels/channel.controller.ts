import { Request, Response } from 'express';
import * as ChannelService from './channel.service';
import { AuthRequest } from '../../middlewares/isAuthenticated';


export const getAllChannelsController = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId
    if (!userId) {
        return res.status(403).json({ message: 'Usuario no autenticado.' });
    }
    const channels = await ChannelService.findAllChannelsForUser(userId);
    res.status(200).json(channels);
};