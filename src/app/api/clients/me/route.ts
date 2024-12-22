// src/app/api/clients/me/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { getToken, JWT } from "next-auth/jwt";

export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  try {
    const token = (await getToken({ req })) as JWT;

    if (!token?.id) {
      return NextResponse.json(
        { error: "No autorizado, token inválido o expirado" },
        { status: 401 }
      );
    }

    const userId: string = token.id as string;
    console.log("userId:", userId);

    const client = await prisma.clientProfile.findUnique({
      where: { user_id: userId },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error al obtener el perfil del cliente:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
