import { NextFunction, Request, Response } from 'express';
import { registerService, loginService, verifyEmail } from './auth.service';

export const registerController = async (req: Request, res: Response) => {
  console.log(req.body)
  try {
    const user = await registerService(req.body);
    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user,
    });
  } catch (error: any) {
    // Manejo de errores simple. Si el email ya existe, Prisma lanzará un error.
    // Más adelante, podemos manejar errores específicos.
    res.status(400).json({ message: error.message });
  }
};

export const loginController = async (req: Request, res: Response) => {
  console.log(req.body)
  try {
    const result = await loginService(req.body);
    res.status(200).json({
      message: 'Inicio de sesión exitoso',
      ...result,
    });
  } catch (error: any) {
    res.status(401).json({ message: error.message }); // 401 Unauthorized para credenciales inválidas
  }
};

export const verifyEmailController = async (req: Request, res: Response, next: NextFunction) => {
  try {
      const { token } = req.query;
      await verifyEmail(token as string);
      // Redirigir a una página de éxito en tu app/web
      res.redirect(`${process.env.FRONTEND_URL}verification-success`);
  } catch (error) {
      next(error);
  }
};