import { NextResponse } from "next/server";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import prisma from "@/libs/prisma"; // Asegúrate de que estás usando prisma

// POST: Generar código QR y secreto para 2FA
export async function POST(req: Request) {
  const { userId } = await req.json();

  try {
    const secret = speakeasy.generateSecret({ length: 20 });
    const qrCode = await QRCode.toDataURL(secret.otpauth_url as string);

    await prisma.user.update({
      where: { id: userId },
      data: { twoFASecret: secret.base32 },
    });

    return NextResponse.json({ qrCode, secret: secret.base32 });
  } catch (error) {
    console.error("Error al generar el secreto 2FA:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT: Verificar el token 2FA
export async function PUT(req: Request) {
  const { userId, token } = await req.json();

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.twoFASecret) {
      return NextResponse.json(
        { error: "Usuario o secreto no encontrado" },
        { status: 404 }
      );
    }

    const isValid = speakeasy.totp.verify({
      secret: user.twoFASecret,
      encoding: "base32",
      token,
    });

    if (!isValid) {
      return NextResponse.json({ error: "Código inválido" }, { status: 400 });
    }

    return NextResponse.json({ message: "2FA habilitado correctamente" });
  } catch (error) {
    console.error("Error al verificar el token 2FA:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
