import { Response, NextFunction } from 'express';
import { AuthRequest } from './isAuthenticated';

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Este middleware debe ejecutarse DESPUÉS de isAuthenticated
  const user = req.user;

  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
  }

  // Si el usuario es un admin, continuamos
  next();
};