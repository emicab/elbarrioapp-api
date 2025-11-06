// En src/api/auth/auth.schemas.ts
import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    firstName: z.string({ error: 'El nombre es requerido.' }).min(2, 'El nombre debe tener al menos 2 caracteres.'),
    lastName: z.string({ error: 'El apellido es requerido.' }).min(2, 'El apellido debe tener al menos 2 caracteres.'),
    email: z.string({ error: 'El email es requerido.' }),
    password: z.string({ error: 'La contraseña es requerida.' }).min(8, 'La contraseña debe tener al menos 8 caracteres.'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string({ error: 'El email es requerido.' }).email('Email no válido.'),
    password: z.string({ error: 'La contraseña es requerida.' }),
  }),
});