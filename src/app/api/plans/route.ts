import { NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { price: "asc" },
    });
    return NextResponse.json(plans, { status: 200 });
  } catch (error) {
    console.error("Error al obtener los planes:", error);
    // Fallback seguro
    return NextResponse.json([], { status: 200 });
  }
}
