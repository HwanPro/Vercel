// src/app/api/debts/cleanup/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";
import { getToken } from "next-auth/jwt";

// POST - Limpiar deudas diarias (automático a medianoche)
export async function POST(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Permitir llamadas internas sin token (para cron jobs)
  const isInternalCall = request.headers.get("x-internal-call") === "true";
  
  if (!isInternalCall && (!token || token.role !== "admin")) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    // Obtener todas las deudas diarias para mover al historial
    const dailyDebts = await prisma.dailyDebt.findMany();

    // Mover todas las deudas al historial
    const historyPromises = dailyDebts.map(debt =>
      prisma.debtHistory.create({
        data: {
          clientProfileId: debt.clientProfileId,
          productType: debt.productType,
          productName: debt.productName,
          amount: debt.amount,
          quantity: debt.quantity,
          debtType: "daily",
          createdAt: debt.createdAt,
          deletedAt: new Date(),
          createdBy: debt.createdBy,
        },
      })
    );

    await Promise.all(historyPromises);

    // Eliminar todas las deudas diarias
    const deleteResult = await prisma.dailyDebt.deleteMany({});

    return NextResponse.json({
      message: "Limpieza de deudas diarias completada",
      deletedCount: deleteResult.count,
      movedToHistory: dailyDebts.length,
    });
  } catch (error) {
    console.error("Error en limpieza de deudas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Limpiar historial semanal (domingos)
export async function DELETE(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || token.role !== "admin") {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const preserve = searchParams.get("preserve") === "true";

  if (preserve) {
    return NextResponse.json({
      message: "Limpieza cancelada - datos preservados por el administrador",
    });
  }

  try {
    // Eliminar historial de más de una semana
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const deleteResult = await prisma.debtHistory.deleteMany({
      where: {
        createdAt: {
          lt: oneWeekAgo,
        },
      },
    });

    return NextResponse.json({
      message: "Limpieza semanal del historial completada",
      deletedCount: deleteResult.count,
    });
  } catch (error) {
    console.error("Error en limpieza semanal:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
