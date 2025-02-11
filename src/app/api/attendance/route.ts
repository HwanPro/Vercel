import { NextResponse } from "next/server";
import prisma from "@/libs/prisma"; // Asegúrate de que la conexión está bien configurada

export async function GET() {
  try {
    const attendanceRecords = await prisma.attendance.findMany({
      orderBy: { checkInTime: "desc" }, // Ordenar por fecha reciente
      include: { user: { select: { name: true, email: true } } }, // Incluir el nombre y correo del usuario
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
