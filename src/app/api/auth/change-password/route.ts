import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await request.json();

  const user = await prisma.user.findUnique({
    where: { id: token.sub },
  });

  if (!user) {
    return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);

  if (!isMatch) {
    return NextResponse.json({ message: "Contraseña actual incorrecta" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  return NextResponse.json({ message: "Contraseña actualizada correctamente" }, { status: 200 });
}
