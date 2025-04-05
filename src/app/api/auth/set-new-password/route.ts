/* import { NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const { token, newPassword } = await request.json();

  if (!token) {
    return NextResponse.json(
      { message: "Acceso no permitido" },
      { status: 403 }
    );
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetToken || resetToken.expires < new Date()) {
    return NextResponse.json(
      { message: "Token inválido o expirado" },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: resetToken.userId },
    data: { password: hashedPassword },
  });

  await prisma.passwordResetToken.delete({ where: { token } });

  return NextResponse.json(
    { message: "Contraseña restablecida con éxito" },
    { status: 200 }
  );
}
 */