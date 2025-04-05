// src/app/api/plans/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";
import { z, ZodError } from "zod";

const planSchema = z.object({
  name: z.string().min(1, { message: "El nombre del plan es obligatorio" }),
  price: z.number().min(0, { message: "El precio debe ser mayor o igual a 0" }),
  // Si ya no usas beneficios, puedes quitar este campo o dejarlo como opcional:
  benefits: z.array(z.string()).optional(),
});

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(plans, { status: 200 });
  } catch (error) {
    console.error("Error GET /api/plans:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = planSchema.parse(body);

    const newPlan = await prisma.plan.create({
      data: {
        name: validatedData.name,
        price: validatedData.price,
        description: validatedData.benefits
          ? validatedData.benefits.join("\n")
          : "",
      },
    });

    return NextResponse.json(newPlan, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      console.error("Zod error en /api/plans:", error.errors);
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error POST /api/plans:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Agregar DELETE usando query parameter
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }
    await prisma.plan.delete({ where: { id } });
    return NextResponse.json(
      { message: "Plan eliminado con éxito" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error DELETE /api/plans:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
