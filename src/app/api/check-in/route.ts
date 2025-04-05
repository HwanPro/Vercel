import { NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json(
        { message: "Número de teléfono no proporcionado." },
        { status: 400 }
      );
    }

    // Buscar el perfil del usuario por teléfono (usando findFirst en vez de findUnique)
    // Eliminar cualquier carácter no numérico y asegurarse de que solo sean los últimos 9 dígitos
    const normalizedPhone = phone.replace(/\D/g, "").slice(-9);

    console.log("🔹 Buscando teléfono normalizado:", normalizedPhone);

    const profile = await prisma.clientProfile.findFirst({
      where: {
        OR: [
          { profile_phone: normalizedPhone }, // Caso sin código de país
          { profile_phone: `+51${normalizedPhone}` }, // Caso con código de país
        ],
      },
      include: { user: true },
    });

    if (!profile || !profile.user) {
      return NextResponse.json(
        { message: "Usuario no encontrado en la BD." },
        { status: 404 }
      );
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Verificar si ya registró asistencia hoy
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        userId: profile.user.id,
        checkInTime: { gte: todayStart, lte: todayEnd },
      },
    });

    if (existingAttendance) {
      return NextResponse.json(
        { message: "El usuario ya ha registrado asistencia hoy." },
        { status: 400 }
      );
    }

    // Registrar asistencia
    await prisma.attendance.create({
      data: {
        userId: profile.user.id,
        checkInTime: new Date(),
      },
    });

    return NextResponse.json(
      {
        message: "Asistencia registrada correctamente.",
        userId: profile.user.id,
      },
      { status: 200 }
    );
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
