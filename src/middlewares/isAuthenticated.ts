import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extendemos el tipo Request de Express para incluir la propiedad 'user'
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const isAuthenticated = (req: AuthRequest, res: Response, next: NextFunction) => {
  // 1. Obtener el token del header 'Authorization'
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No se proporcionó un token o el formato es incorrecto.' });
  }

  const token = authHeader.split(' ')[1];

  // 2. Verificar el token
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('El secreto del JWT no está configurado');
    }

    const decoded = jwt.verify(token, secret);

    // 3. Si el token es válido, adjuntamos el payload al objeto request
    req.user = decoded as { userId: string; role: string };
    
    // 4. Continuamos con el siguiente middleware o controlador
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado.' });
  }
};
