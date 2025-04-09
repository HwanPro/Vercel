// src/app/api/admin/summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || token.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const totalIncome = await prisma.paymentRecord.aggregate({
      _sum: { payment_amount: true },
    });

    const newClients = await prisma.user.count({
      where: {
        role: "client",
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30)), // últimos 30 días
        },
      },
    });

    const productSales = await prisma.purchase.aggregate({
      _sum: { purchase_total: true },
    });

    const classAttendance = await prisma.attendance.count({
      where: {
        checkInTime: {
          gte: new Date(new Date().setDate(new Date().getDate() - 7)),
        },
      },
    });

    return NextResponse.json({
      totalIncome: totalIncome._sum.payment_amount || 0,
      newClients,
      productSales: productSales._sum.purchase_total || 0,
      classAttendance,
    });
  } catch (error) {
    console.error("Error resumen admin:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
