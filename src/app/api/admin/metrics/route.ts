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
    // Obtener métricas en tiempo real
    const [
      totalIncome,
      newClients,
      productSales,
      classAttendance,
      todayAttendance,
      activeMemberships,
      lowStockProducts
    ] = await Promise.all([
      // Ingresos totales
      prisma.paymentRecord.aggregate({
        _sum: { payment_amount: true },
      }),
      
      // Nuevos clientes (últimos 30 días)
      prisma.user.count({
        where: {
          role: "client",
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 30)),
          },
        },
      }),
      
      // Ventas de productos
      prisma.purchase.aggregate({
        _sum: { purchase_total: true },
      }),
      
      // Asistencia total (últimos 7 días)
      prisma.attendance.count({
        where: {
          checkInTime: {
            gte: new Date(new Date().setDate(new Date().getDate() - 7)),
          },
        },
      }),
      
      // Asistencia de hoy
      prisma.attendance.count({
        where: {
          checkInTime: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      
      // Membresías activas
      prisma.clientProfile.count({
        where: {
          profile_end_date: {
            gte: new Date(),
          },
        },
      }),
      
      // Productos con stock bajo
      prisma.inventoryItem.count({
        where: {
          item_stock: {
            lte: 10,
          },
        },
      })
    ]);

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
