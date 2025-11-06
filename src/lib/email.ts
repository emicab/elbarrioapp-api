import nodemailer from 'nodemailer';

// Configura tu transporte (ejemplo con SendGrid, reemplaza con tus credenciales)
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey', // Esto es literal, no lo cambies
    pass: process.env.SENDGRID_API_KEY,
  },
});

export const sendVerificationEmail = async (to: string, token: string) => {
  const verificationLink = `${process.env.API_URL}/api/auth/verify-email?token=${token}`;

  await transporter.sendMail({
    from: '"ElBarrioApp" <no-reply@ElBarrioApp.com>',
    to: to,
    subject: 'Verifica tu cuenta en ElBarrioApp',
    html: `
      <h1>¡Bienvenido a ElBarrioApp!</h1>
      <p>Por favor, haz clic en el siguiente enlace para verificar tu correo electrónico:</p>
      <a href="${verificationLink}">Verificar mi Correo</a>
    `,
  });
};