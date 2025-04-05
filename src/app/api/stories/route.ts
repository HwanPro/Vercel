// src/app/api/stories/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";
import { z, ZodError } from "zod";

// Definimos el esquema de validación Zod
const storySchema = z.object({
  title: z.string().min(1, { message: "El título es obligatorio" }),
  content: z.string().min(1, { message: "El contenido es obligatorio" }),
  imageUrl: z.string().url().optional(),
  link: z.string().url().optional(),
});

// GET: Retorna todas las historias ordenadas por fecha descendente
export async function GET() {
  try {
    const stories = await prisma.story.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(stories, { status: 200 });
  } catch (error) {
    console.error("Error GET /api/stories:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST: Crear una nueva historia
// POST: Crear una nueva historia
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = storySchema.parse(body);
    const newStory = await prisma.story.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        imageUrl: validatedData.imageUrl ?? "",
        link: validatedData.link ?? null,
      },
    });
    return NextResponse.json(newStory, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      console.error("Zod error:", error.errors);
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error POST /api/stories:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT: Actualizar historia (se espera que en el body venga también el id)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id)
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    const updatedStory = await prisma.story.update({
      where: { id },
      data,
    });
    return NextResponse.json(updatedStory, { status: 200 });
  } catch (error) {
    console.error("Error PUT /api/stories:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar historia pasando el id como query parameter
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }
    await prisma.story.delete({ where: { id } });
    return NextResponse.json(
      { message: "Historia eliminada" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error DELETE /api/stories:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
