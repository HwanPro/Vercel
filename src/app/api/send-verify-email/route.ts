import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import crypto from "crypto";
import prisma from "@/libs/prisma"; // Asegúrate de tener prisma configurado correctamente

// Configuración del transporte de correo
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "", // Asegúrate de que EMAIL_HOST esté definido
  port: parseInt(process.env.EMAIL_PORT || "587"), // Usa un valor por defecto si EMAIL_PORT no está definido
  secure: process.env.EMAIL_PORT === "465", // true para puerto 465 (SSL), false para otros puertos
  auth: {
    user: process.env.EMAIL_USER || "", // Asegúrate de que EMAIL_USER esté definido
    pass: process.env.EMAIL_PASS || "", // Asegúrate de que EMAIL_PASS esté definido
  },
});

// Verificar configuración SMTP
transporter.verify((error, success) => {
  if (error) {
    console.error("Error en la configuración SMTP:", error);
  } else {
    console.log("El servidor SMTP está listo para enviar correos");
  }
});

// Función para enviar correos genéricos
export async function sendEmail(to: string, subject: string, html: string) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM, // Remitente
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("Error al enviar el correo:", error);
    throw new Error("Error al enviar el correo");
  }
}

// Función para enviar el correo de verificación
export async function sendVerificationEmail(email: string, token: string) {
  const verificationLink = `${process.env.APP_URL}/auth/verify-email?token=${token}`;
  try {
    await transporter.sendMail({
      from: `"Wolf Gym" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Verifica tu correo electrónico",
      html: `
        <p>Gracias por registrarte en Wolf Gym.</p>
        <p>Haz clic en el siguiente enlace para verificar tu cuenta:</p>
        <a href="${verificationLink}" target="_blank">Verificar cuenta</a>
      `,
    });
  } catch (error) {
    console.error("Error al enviar el correo de verificación:", error);
    throw new Error("Error al enviar el correo de verificación");
  }
}

// Endpoint para manejar solicitudes POST
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "El email es obligatorio" },
        { status: 400 }
      );
    }

    // Generar un token único
    const token = crypto.randomBytes(32).toString("hex");

    // Guardar el token en la base de datos
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expira en 24 horas
      },
    });

    // Enviar el correo de verificación
    await sendVerificationEmail(email, token);

    return NextResponse.json({ message: "Correo enviado con éxito" });
  } catch (error) {
    console.error("Error en el endpoint de verificación:", error);
    return NextResponse.json(
      { error: "No se pudo enviar el correo" },
      { status: 500 }
    );
  }
}
