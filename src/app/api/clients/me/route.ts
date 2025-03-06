import { NextRequest, NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { getToken } from "next-auth/jwt";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Obtiene el token sin forzar el nombre de cookie
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.id) {
      console.error("🔴 Token inválido o expirado.");
      return NextResponse.json(
        { error: "No autorizado, token inválido o expirado" },
        { status: 401 }
      );
    }
    const userId = token.id as string;
    console.log("🟢 userId:", userId);

    // Busca el usuario y sus relaciones
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        memberships: { include: { membership: true } },
        attendances: true,
      },
    });

    if (!user) {
      console.error("🔴 Usuario no encontrado.");
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    console.log("🟢 Usuario encontrado:", user);
    return NextResponse.json(user);
  } catch (error) {
    console.error("❌ Error al obtener el perfil del cliente:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
