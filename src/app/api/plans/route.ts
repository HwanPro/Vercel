import { NextResponse } from 'next/server';
import prisma from '@/infrastructure/prisma/prisma';

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { price: 'asc' },
    });
    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error al obtener los planes:', error);
    return NextResponse.json({ error: 'Error al obtener planes' }, { status: 500 });
  }
}
