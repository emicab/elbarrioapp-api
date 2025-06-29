import { Response, NextFunction } from 'express';
import { AuthRequest } from './isAuthenticated';

export const isProducer = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Este middleware debe ejecutarse DESPUÉS de isAuthenticated
  const user = req.user;

  if (!user || user.role !== 'PRODUCER') {
    return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de productor.' });
  }

  // Si el usuario es un productor, continuamos
  next();
};