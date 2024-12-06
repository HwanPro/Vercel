// src/app/api/admin/dashboard/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/libs/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authOptions';

export async function GET(request: Request) {
  try {
    console.log('Iniciando la obtención de la sesión...');
    const session = await getServerSession(authOptions);
    console.log('Sesión obtenida:', session);

    if (!session || session.user.role !== 'admin') {
      console.log('Usuario no autorizado');
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    console.log('Obteniendo los datos del dashboard...');

    // Ingresos totales (suma de todas las compras)
    const totalIncomeResult = await prisma.purchase.aggregate({
      _sum: {
        purchase_total: true, // Asegúrate de que 'purchase_total' existe en tu modelo 'Purchase'
      },
    });
    console.log('Resultado de ingresos totales:', totalIncomeResult);

    const totalIncome = totalIncomeResult._sum.purchase_total || 0;

    // Nuevos clientes (usuarios creados en los últimos 30 días)
    const newClients = await prisma.user.count({
      where: {
        role: 'client',
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30)),
        },
      },
    });
    console.log('Nuevos clientes en los últimos 30 días:', newClients);

    // Ventas de productos (compras realizadas en los últimos 30 días)
    const productSales = await prisma.purchase.count({
      where: {
        purchase_date: { // Asegúrate de que 'purchase_date' existe en tu modelo 'Purchase'
          gte: new Date(new Date().setDate(new Date().getDate() - 30)),
        },
      },
    });
    console.log('Ventas de productos en los últimos 30 días:', productSales);

    // Asistencia a clases (si tienes este modelo, ajusta según corresponda)
    const classAttendance = 0; // Placeholder, ajusta según tu modelo

    const data = {
      totalIncome,
      newClients,
      productSales,
      classAttendance,
    };

    console.log('Datos del dashboard obtenidos:', data);

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error al obtener los datos del dashboard:', error);
    return NextResponse.json(
      { message: 'Error al obtener los datos del dashboard' },
      { status: 500 }
    );
  }
}
