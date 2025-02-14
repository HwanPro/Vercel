import { NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { randomBytes } from "crypto";
import { sendEmail } from "@/libs/mail";

export async function POST(request: Request) {
  const { email } = await request.json();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return NextResponse.json(
      { message: "Si el correo es válido, recibirás un enlace" },
      { status: 200 }
    );
  }

  const token = randomBytes(32).toString("hex");

  await prisma.passwordResetToken.upsert({
    where: { userId: user.id },
    update: { token, expires: new Date(Date.now() + 1000 * 60 * 60) },
    create: {
      userId: user.id,
      token,
      expires: new Date(Date.now() + 1000 * 60 * 60),
    },
  });

  const resetLink = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

  const emailContent = `
    <h3>Recuperación de contraseña</h3>
    <p>Hola ${user.name},</p>
    <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
    <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
    <a href="${resetLink}" target="_blank">Restablecer contraseña</a>
    <p>Este enlace expirará en 1 hora.</p>
    <p>Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
    <p><strong>Wolf Gym - Libera tu lobo interior 🐺</strong></p>
  `;

  await sendEmail(
    user.email,
    "Recuperación de contraseña - Wolf Gym",
    emailContent
  );

  return NextResponse.json(
    { message: "Si el correo es válido, recibirás un enlace" },
    { status: 200 }
  );
}
