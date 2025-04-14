import { NextRequest, NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";

// GET: Lista de asistencia (opcional)
export async function GET() {
  const records = await prisma.attendance.findMany({
    orderBy: { checkInTime: "desc" },
    include: {
      user: {
        select: {
          username: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
        },
      },
    },
  });
  return NextResponse.json(records);
}

// POST: Registrar entrada o salida
export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone || typeof phone !== "string") {
      return NextResponse.json({ message: "Número requerido" }, { status: 400 });
    }

    // Buscar usuario por número
    const user = await prisma.user.findUnique({
      where: { phoneNumber: phone },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Número no encontrado", reason: "not_found" },
        { status: 404 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ¿Ya tiene entrada hoy sin salida?
    const registroHoy = await prisma.attendance.findFirst({
      where: {
        userId: user.id,
        checkInTime: { gte: today },
      },
      orderBy: { checkInTime: "desc" },
    });

    if (registroHoy && !registroHoy.checkOutTime) {
      // Registrar salida
      const salida = new Date();
      const duration = Math.round((salida.getTime() - new Date(registroHoy.checkInTime).getTime()) / 60000);

      const updated = await prisma.attendance.update({
        where: { id: registroHoy.id },
        data: {
          checkOutTime: salida,
          durationMins: duration,
        },
      });

      return NextResponse.json({ message: "Salida registrada", record: updated });
    }

    // Si ya registró hoy entrada y salida
    if (registroHoy?.checkOutTime) {
      return NextResponse.json(
        {
          message: "Ya ha registrado asistencia hoy",
          reason: "already_checked_in",
        },
        { status: 400 }
      );
    }

    // Registrar nueva entrada
    const entry = await prisma.attendance.create({
      data: {
        userId: user.id,
        checkInTime: new Date(),
      },
    });

    return NextResponse.json({ message: "Entrada registrada", record: entry });
  } catch (error) {
    console.error("❌ Error en check-in:", error);
    return NextResponse.json(
      { message: "Error al registrar asistencia", error },
      { status: 500 }
    );
  }
}
