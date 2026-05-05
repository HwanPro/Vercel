// src/app/api/plans/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";
import { toMembershipPlanView } from "@/lib/membershipPlans";


export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { name, price, description } = await request.json();

    // Lógica para actualizar
    const updatedPlan = await prisma.plan.update({
      where: { id },
      data: { name, price, description },
    });

    return NextResponse.json(toMembershipPlanView(updatedPlan), { status: 200 });
  } catch (error) {
    console.error("Error en PUT /api/plans/[id]:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
