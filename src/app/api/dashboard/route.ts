import { NextRequest, NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  try {
    // Verificas token si quieres asegurar que solo admin vea esto
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token || token.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 1. Ingresos Totales
    // Asumiendo que en `PaymentRecord` guardas en `payment_amount` el total.
    // Sino, ajusta a la tabla/columna que uses (Purchase, etc.)
    const totalIncomeData = await prisma.paymentRecord.aggregate({
      _sum: { payment_amount: true },
    });
    const totalIncome = totalIncomeData._sum.payment_amount || 0;

    // 2. Nuevos Clientes
    // Definir "nuevos" => 7 días? 30 días? o total?
    // Ej: clientes creados en la última semana
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newClients = await prisma.clientProfile.count({
      where: {
        // Filtras por la fecha de creación en user o clientProfile
        // asumiendo user.createdAt
        user: {
          createdAt: { gte: oneWeekAgo },
          role: "client",
        },
      },
    });

    // 3. Ventas de Productos
    // O bien sumas la cantidad vendida en la tabla `Purchase`,
    // o la cantidad total en soles (purchase_total), etc.
    const productSalesData = await prisma.purchase.aggregate({
      _sum: { purchase_total: true },
    });
    const productSales = productSalesData._sum.purchase_total || 0;

    // 4. Asistencia a clases
    // Asumiendo que tienes un Attendance con .count() o sum
    // Ejemplo: total de attendances
    const classAttendance = await prisma.attendance.count();

    // Retornar:
    const result = {
      totalIncome,
      newClients,
      productSales,
      classAttendance,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error GET /api/dashboard:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
