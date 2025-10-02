// src/app/api/test-checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ ok: false, message: "userId requerido" }, { status: 400 });
    }

    // Obtener datos del usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            dailyDebts: {
              where: {
                date: {
                  gte: new Date(new Date().setHours(0, 0, 0, 0)),
                  lt: new Date(new Date().setHours(23, 59, 59, 999)),
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.profile) {
      return NextResponse.json({ ok: false, message: "Usuario no encontrado" }, { status: 404 });
    }

    const profile = user.profile;

    // Calcular deudas
    const monthlyDebt = profile.profile_debt || 0;
    const dailyDebt = profile.dailyDebts?.reduce((sum, debt) => sum + debt.amount, 0) || 0;
    const totalDebt = monthlyDebt + dailyDebt;

    // Simular minutos en el gimnasio (para testing)
    const mockMinutes = Math.floor(Math.random() * 120) + 30; // Entre 30 y 150 minutos

    // Simular registro de salida (sin guardar en BD para testing)
    const mockRecord = {
      id: `test-checkout-${Date.now()}`,
      userId: user.id,
      checkInTime: new Date(Date.now() - mockMinutes * 60 * 1000), // Hace X minutos
      checkOutTime: new Date(),
      type: "gym",
      channel: "test",
      stationId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      durationMins: mockMinutes,
    };

    return NextResponse.json({
      ok: true,
      userId: user.id,
      fullName: `${user.firstName} ${user.lastName}`,
      plan: profile.profile_plan || "Sin plan",
      monthlyDebt,
      dailyDebt,
      totalDebt,
      avatarUrl: user.image,
      profileId: profile.profile_id,
      action: "checkout",
      type: "test",
      minutesOpen: mockMinutes,
      message: `✅ MODO PRUEBA - Salida simulada (${mockMinutes} min)`,
      record: mockRecord,
    });
  } catch (error) {
    console.error("Error en test-checkout:", error);
    return NextResponse.json({ ok: false, message: "Error interno del servidor" }, { status: 500 });
  }
}

