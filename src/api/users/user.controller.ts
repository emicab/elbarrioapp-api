import {Response} from 'express';
import {AuthRequest} from '../../middlewares/isAuthenticated';
import * as UserService from './user.service';

/**
 * Obtiene el perfil del usuario actualmente autenticado.
 */
export const getMeController = async (req : AuthRequest, res : Response) => {
    try {
        const userId = req.user?.userId;
        if (! userId) {
            return res.status(400).json({message: 'No se encontró el ID de usuario en el token.'});
        }
        const user = await UserService.findUserById(userId);
        res.status(200).json(user);
    } catch (error : any) {
        res.status(500).json({message: error.message});
    }
};

/**
 * Obtiene el perfil público de un usuario por su ID.
 */
export const getUserByIdController = async (req : AuthRequest, res : Response) => {
    try {
        const {id} = req.params;
        const user = await UserService.findUserById(id);
        // Para perfiles públicos, no queremos mostrar el email
        const {
            email,
            ...publicProfile
        } = user;
        res.status(200).json(publicProfile);
    } catch (error : any) {
        res.status(404).json({message: error.message});
    }
};

/**
 * Actualiza la biografía del perfil del usuario autenticado.
 */
export const updateMeController = async (req : AuthRequest, res : Response) => {
    try {
        const userId = req.user ?. userId;
        
        if (! userId) {
            return res.status(403).json({message: 'Usuario no autenticado.'});
        }
        const data = req.body
        const profile = await UserService.updateUserProfile(userId, data);
        res.status(200).json({message: 'Perfil actualizado exitosamente', profile});
    } catch (error : any) {
        res.status(500).json({message: error.message});
    }
};

/**
 * Sube o actualiza el avatar del usuario autenticado.
 */
export const uploadAvatarController = async (req : AuthRequest, res : Response) => {
    try {
        const userId = req.user ?. userId;
        const file = req.file;

        if (! userId) {
            return res.status(403).json({message: 'Usuario no autenticado.'});
        }
        if (! file) {
            return res.status(400).json({message: 'No se ha subido ningún archivo.'});
        }

        const imageUrl = await UserService.uploadImage(file.buffer);

        const updatedProfile = await UserService.updateUserAvatar(userId, imageUrl );

        res.status(200).json({message: 'Avatar actualizado exitosamente.', profile: updatedProfile});
    } catch (error : any) {
        res.status(500).json({message: `Error al subir la imagen: ${
                error.message
            }`});
    }
};

/**
 * Recibe y guarda el Expo Push Token del frontend.
 */
export const updatePushTokenController = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const { token } = req.body;
  
      if (!userId) {
        return res.status(403).json({ message: 'Usuario no autenticado.' });
      }
      if (!token) {
        return res.status(400).json({ message: 'No se proporcionó ningún token.' });
      }
  
      await UserService.updatePushToken(userId, token);
      res.status(200).json({ message: 'Push token actualizado correctamente.' });
    } catch (error: any) {
      res.status(500).json({ message: 'Error al actualizar el push token.' });
    }
  };
