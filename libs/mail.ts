import nodemailer from "nodemailer";

// Configuración del transporte de correo
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_PORT === "465",
  auth: {
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || "",
  },
});

// Verificar configuración SMTP
transporter.verify((error) => {
  if (error) {
    console.error("❌ Error en la configuración SMTP:", error);
  } else {
    console.log("✅ Servidor SMTP listo para enviar correos");
  }
});

// Función para enviar correos genéricos
export async function sendEmail(to: string, subject: string, html: string) {
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

// Función para enviar el correo de verificación
export async function sendVerificationEmail(email: string, token: string) {
  const verificationLink = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`;
  const html = `
    <p>Gracias por registrarte en Wolf Gym.</p>
    <p>Haz clic en el siguiente enlace para verificar tu cuenta:</p>
    <a href="${verificationLink}" target="_blank">Verificar cuenta</a>
    <p>Si no solicitaste este correo, puedes ignorarlo.</p>
  `;

  try {
    await sendEmail(email, "Verifica tu correo electrónico", html);
  } catch (error) {
    console.error("❌ Error al enviar el correo de verificación:", error);
    throw new Error("Error al enviar el correo de verificación");
  }
}
