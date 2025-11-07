import { prisma } from '../../lib/prisma';
// import { RegisterInput, LoginInput } from './auth.types'; // Crearemos este archivo después
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { sendVerificationEmail } from '../../lib/email';

// NOTA: De momento, usaremos 'any' para los tipos de entrada por simplicidad.
// Luego lo reemplazaremos con tipos de Zod para validación.

export const registerService = async (input: any) => {
  console.log(input)

  // const verificationToken = crypto.randomBytes(32).toString('hex')
  // 1. Hashear la contraseña
  const hashedPassword = await bcrypt.hash(input.password, 10);

  // 2. Crear el nuevo usuario en la base de datos
  const newUser = await prisma.user.create({
    data: {
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      password: hashedPassword,
      points: 4000,
      // verificationToken: verificationToken,
    },
  });

  // await sendVerificationEmail(newUser.email, verificationToken);
  // 3. Devolver el usuario creado (sin la contraseña)
  const { password, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

export const loginService = async (input: any) => {
  // 1. Encontrar al usuario por su email
  console.log(input)
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  // Si no se encuentra el usuario, lanzar un error
  if (!user) {
    throw new Error('Credenciales inválidas');
  }

  // 2. Comparar la contraseña proporcionada con la hasheada en la BD
  const isPasswordValid = await bcrypt.compare(input.password, user.password);

  if (!isPasswordValid) {
    throw new Error('Credenciales inválidas');
  }

  // 3. Si la contraseña es válida, generar un JWT
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('El secreto del JWT no está configurado');
  }

  const token = jwt.sign({ userId: user.id, role: user.role }, secret, {
    expiresIn: '7d', // El token expirará en 7 días
  });

  // 4. Devolver el token y la información del usuario
  const { password, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
};

export const verifyEmail = async (token: string) => {
  const user = await prisma.user.findFirst({
    where: { verificationToken: token },
  });

  if (!user) {
    throw new Error('Token de verificación no válido o ya ha sido usado.');
  }

  return prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(), // Marcamos como verificado
      verificationToken: null, // Limpiamos el token para que no se pueda reusar
    },
  });
};