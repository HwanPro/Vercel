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
    // Tolerar fallos parciales para no tumbar todo el dashboard.
    const results = await Promise.allSettled([
      prisma.paymentRecord.aggregate({
        _sum: { payment_amount: true },
      }),
      prisma.user.count({
        where: {
          role: "client",
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 30)),
          },
        },
      }),
      prisma.purchase.aggregate({
        _sum: { purchase_total: true },
      }),
      prisma.attendance.count({
        where: {
          checkInTime: {
            gte: new Date(new Date().setDate(new Date().getDate() - 7)),
          },
        },
      }),
      prisma.attendance.count({
        where: {
          checkInTime: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      prisma.clientProfile.count({
        where: {
          profile_end_date: {
            gte: new Date(),
          },
        },
      }),
      prisma.inventoryItem.count({
        where: {
          item_stock: {
            lte: 10,
          },
        },
      }),
    ]);

    const takeValue = <T,>(index: number, fallback: T): T => {
      const result = results[index];
      if (result.status === "fulfilled") return result.value as T;
      console.error("Métrica fallida", index, result.reason);
      return fallback;
    };

    const totalIncome = takeValue<{ _sum: { payment_amount: number | null } }>(
      0,
      { _sum: { payment_amount: 0 } }
    );
    const newClients = takeValue<number>(1, 0);
    const productSales = takeValue<{ _sum: { purchase_total: number | null } }>(
      2,
      { _sum: { purchase_total: 0 } }
    );
    const classAttendance = takeValue<number>(3, 0);
    const todayAttendance = takeValue<number>(4, 0);
    const activeMemberships = takeValue<number>(5, 0);
    const lowStockProducts = takeValue<number>(6, 0);

    return NextResponse.json({
      totalIncome: totalIncome._sum.payment_amount || 0,
      newClients,
      productSales: productSales._sum.purchase_total || 0,
      classAttendance,
      todayAttendance,
      activeMemberships,
      lowStockProducts,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error obteniendo métricas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
