import { NextRequest, NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { getToken, JWT } from "next-auth/jwt";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Obtenemos el token de NextAuth
    const token = (await getToken({ req })) as JWT;
    if (!token?.id) {
      return NextResponse.json(
        { error: "No autorizado, token inválido o expirado" },
        { status: 401 }
      );
    }

    // userId es el ID del usuario logueado
    const userId = token.id as string;
    console.log("userId:", userId);

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
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Devolvemos todo el objeto user
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error al obtener el perfil del cliente:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
