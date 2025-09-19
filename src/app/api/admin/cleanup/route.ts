// src/app/api/admin/cleanup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { cleanupDailyDebts, cleanupWeeklyHistory } from "@/scripts/cleanup-debts";

export async function POST(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || token.role !== "admin") {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const { type } = await request.json();

    switch (type) {
      case 'daily':
        await cleanupDailyDebts();
        return NextResponse.json({
          message: "Limpieza de deudas diarias completada exitosamente",
          success: true,
        });

      case 'weekly':
        await cleanupWeeklyHistory();
        return NextResponse.json({
          message: "Limpieza semanal del historial completada exitosamente",
          success: true,
        });

      case 'both':
        await cleanupDailyDebts();
        await cleanupWeeklyHistory();
        return NextResponse.json({
          message: "Limpieza completa realizada exitosamente",
          success: true,
        });

      default:
        return NextResponse.json(
          { error: "Tipo de limpieza no válido. Use: daily, weekly, o both" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error en limpieza:", error);
    return NextResponse.json(
      { 
        error: "Error interno del servidor",
        message: error instanceof Error ? error.message : "Error desconocido",
        success: false,
      },
      { status: 500 }
    );
  }
}
