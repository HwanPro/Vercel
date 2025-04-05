import { NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  console.log("⏳ Iniciando GET /api/clients...");

  // Obtener el token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  console.log("🔑 Token recibido en GET:", token);

  if (!token || token.role !== "admin") {
    console.log("🚫 Token inválido o usuario no autorizado");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const clients = await prisma.clientProfile.findMany();
    return NextResponse.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json({ error: "Error fetching clients" }, { status: 500 });
  }
}
