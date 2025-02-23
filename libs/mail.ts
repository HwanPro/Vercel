import nodemailer from "nodemailer";
import {
  generateEmailTemplate,
  generatePasswordResetEmailTemplate,
} from "@/libs/emailTemplate";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: Number(process.env.EMAIL_PORT) === 465, // ✅ Verificación correcta del puerto
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error("❌ Error en la configuración SMTP:", error);
  } else {
    console.log("✅ Servidor SMTP listo para enviar correos");
  }
});

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error(
      "⚠️ No se enviará el correo, credenciales de SMTP faltantes."
    );
    return;
  }

  try {
    await transporter.sendMail({
      from: `"Wolf Gym" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("❌ Error al enviar el correo:", error);
    throw new Error("Error al enviar el correo");
  }
}

export async function sendVerificationEmail(
  email: string,
  firstName: string,
  token: string
) {
  const verificationLink = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;
  const html = generateEmailTemplate({
    firstName,
    email,
    verificationLink,
  });

  await sendEmail(email, "Verifica tu cuenta - Wolf Gym", html);
}

export async function sendManualCredentialsEmail(
  email: string,
  firstName: string,
  password: string,
  verificationToken: string
) {
  const verificationLink = `${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken}`;
  const html = generateEmailTemplate({
    firstName,
    email,
    password,
    verificationLink,
    showCredentials: true,
    showPasswordChangeLink: true,
  });

  await sendEmail(email, "Acceso y verificación - Wolf Gym", html);
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
) {
  const resetLink = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;
  const html = generatePasswordResetEmailTemplate(name, resetLink);

  await sendEmail(email, "Recuperación de contraseña - Wolf Gym", html);
}
