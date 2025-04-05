// /app/api/admin/me/route.ts (o donde prefieras)
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Busca el usuario admin con su profile, etc.
    const admin = await prisma.user.findUnique({
      where: { id: token.id },
      include: { profile: true },
    });
    if (!admin) {
      return NextResponse.json(
        { error: "Admin no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(admin, { status: 200 });
  } catch (error) {
    console.error("Error GET /api/admin/me:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
