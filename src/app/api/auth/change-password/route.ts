// /api/auth/change-password/route.ts
import { NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!user) {
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Verificar contraseña actual
    const match = await bcrypt.compare(currentPassword, user.password ?? '');
    if (!match) {
      return NextResponse.json(
        { message: "Contraseña actual incorrecta" },
        { status: 400 }
      );
    }

    // Actualizar contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    // Enviar correo de confirmación
    // sendPasswordChangedEmail(user.email, ...);

    return NextResponse.json({ message: "Contraseña actualizada" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
