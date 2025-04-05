/* import { NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";
import { randomBytes } from "crypto";
import { sendPasswordResetEmail } from "@/libs/mail";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Tu correo es válido, recibirás un enlace" },
        { status: 200 }
      );
    }
    if (!user) {
      return NextResponse.json(
        { message: "Correo no registrado" },
        { status: 404 }
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

    await sendPasswordResetEmail(user.email, user.name, token);

    return NextResponse.json(
      { message: "Tu correo es válido, recibirás un enlace" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al enviar correo de recuperación:", error);
    return NextResponse.json(
      { message: "Hubo un error, intenta nuevamente." },
      { status: 500 }
    );
  }
}
 */