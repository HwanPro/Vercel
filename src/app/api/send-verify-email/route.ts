import { NextRequest, NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { sendVerificationEmail } from "@/libs/mail";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "El email es obligatorio" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { message: "Este correo ya ha sido verificado" },
        { status: 400 }
      );
    }

    // Buscar un token existente
    const existingToken = await prisma.verificationToken.findFirst({
      where: { identifier: email },
    });

    if (existingToken && new Date() < existingToken.expires) {
      return NextResponse.json(
        { message: "Ya se envió un correo, revisa tu bandeja de entrada." },
        { status: 400 }
      );
    }

    // Generar un nuevo token
    const token = crypto.randomBytes(32).toString("hex");

    await prisma.verificationToken.upsert({
      where: {
        identifier_token: {
          identifier: email,
          token: existingToken?.token || "",
        },
      },
      update: {
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expira en 24 horas
      },
      create: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Enviar el correo de verificación
    await sendVerificationEmail(
      user.email,
      `${user.name} ${user.lastName}`,
      token
    );

    return NextResponse.json({ message: "Correo reenviado con éxito" });
  } catch (error) {
    console.error("Error reenviando el correo de verificación:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
