import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail", // O el proveedor SMTP que uses
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (email: string, url: string) => {
  await transporter.sendMail({
    from: `Tu App <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: "Activa tu cuenta",
    html: `
      <p>Hola,</p>
      <p>Haz clic en el siguiente enlace para activar tu cuenta:</p>
      <a href="${url}">Activar cuenta</a>
      <p>Gracias,</p>
      <p>El equipo de Tu App</p>
    `,
  });
};
