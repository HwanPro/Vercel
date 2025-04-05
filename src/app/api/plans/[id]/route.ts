// src/app/api/plans/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await prisma.plan.delete({ where: { id } });
    return NextResponse.json(
      { message: "Plan eliminado con éxito" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al eliminar plan:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
