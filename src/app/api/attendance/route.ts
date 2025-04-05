import { NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";

export async function GET() {
  try {
    const attendanceRecords = await prisma.attendance.findMany({
      orderBy: { checkInTime: "desc" }, // Ordenar por fecha reciente
      include: { user: { select: { firstName: true, } } }, // Incluir el nombre y correo del usuario
    });

    return NextResponse.json(attendanceRecords, { status: 200 });
  } catch (error) {
    console.error("❌ Error en la API de asistencia:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";

    return NextResponse.json(
      { message: "Error al registrar asistencia", error: errorMessage },
      { status: 500 }
    );
  }
}
