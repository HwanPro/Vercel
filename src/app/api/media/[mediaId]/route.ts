import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Esquema de validación para actualizar media
const updateMediaSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  order: z.number().min(0).optional(),
  isCover: z.boolean().optional()
});

// PUT - Actualizar media (reordenar, marcar cover, etc.)
export async function PUT(
  req: NextRequest,
  { params }: { params: { mediaId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const data = updateMediaSchema.parse(body);

    // Verificar que el media existe
    const existingMedia = await prisma.exerciseMedia.findUnique({
      where: { id: params.mediaId }
    });

    if (!existingMedia) {
      return NextResponse.json(
        { error: "Media no encontrado" },
        { status: 404 }
      );
    }

    // Si se marca como cover, desmarcar otros covers del mismo ejercicio
    if (data.isCover) {
      await prisma.exerciseMedia.updateMany({
        where: { 
          exerciseId: existingMedia.exerciseId,
          isCover: true,
          id: { not: params.mediaId }
        },
        data: { isCover: false }
      });
    }

    // Actualizar media
    await prisma.exerciseMedia.update({
      where: { id: params.mediaId },
      data
    });

    return NextResponse.json({ ok: true });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error al actualizar media:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar media
export async function DELETE(
  req: NextRequest,
  { params }: { params: { mediaId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Verificar que el media existe
    const existingMedia = await prisma.exerciseMedia.findUnique({
      where: { id: params.mediaId }
    });

    if (!existingMedia) {
      return NextResponse.json(
        { error: "Media no encontrado" },
        { status: 404 }
      );
    }

    // Eliminar media
    await prisma.exerciseMedia.delete({
      where: { id: params.mediaId }
    });

    // TODO: Aquí se podría agregar lógica para eliminar el archivo de S3
    // si es necesario, aunque generalmente se mantienen por seguridad

    return NextResponse.json(null, { status: 204 });

  } catch (error) {
    console.error("Error al eliminar media:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
