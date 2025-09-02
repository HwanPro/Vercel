import { NextRequest, NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: token.id as string },
      include: {
        profile: true, // ✅ relación válida con ClientProfile
        memberships: {
          include: {
            membership: true, // incluir detalles del plan
          },
        },
       // attendances: true, // asistencia del usuario
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        id: user.id,
        username: user.username,
        name: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        image: user.image ?? null,
        role: user.role,
        profile: user.profile,
        memberships: user.memberships,
        //attendances: user.attendances,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error en GET /api/user/me:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
