import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Esquema de validación para crear media
const createMediaSchema = z.object({
  type: z.enum(["image", "video"]),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  durationSec: z.number().min(0).optional(),
  order: z.number().min(0).default(0),
  isCover: z.boolean().default(false)
});

// POST - Crear media para ejercicio
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const data = createMediaSchema.parse(body);

    // Verificar que el ejercicio existe
    const exercise = await prisma.exercise.findUnique({
      where: { id: params.id }
    });

    if (!exercise) {
      return NextResponse.json(
        { error: "Ejercicio no encontrado" },
        { status: 404 }
      );
    }

    // Si se marca como cover, desmarcar otros covers
    if (data.isCover) {
      await prisma.exerciseMedia.updateMany({
        where: { 
          exerciseId: params.id,
          isCover: true 
        },
        data: { isCover: false }
      });
    }

    // Si no se especifica order, usar el siguiente disponible
    if (data.order === 0) {
      const lastMedia = await prisma.exerciseMedia.findFirst({
        where: { exerciseId: params.id },
        orderBy: { order: 'desc' }
      });
      data.order = (lastMedia?.order || 0) + 1;
    }

    const media = await prisma.exerciseMedia.create({
      data: {
        ...data,
        exerciseId: params.id
      }
    });

    return NextResponse.json({ id: media.id });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error al crear media:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// GET - Obtener media de un ejercicio
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que el ejercicio existe
    const exercise = await prisma.exercise.findUnique({
      where: { id: params.id }
    });

    if (!exercise) {
      return NextResponse.json(
        { error: "Ejercicio no encontrado" },
        { status: 404 }
      );
    }

    // Si no es admin, solo mostrar media de ejercicios publicados
    if (session.user?.role !== 'admin' && !exercise.isPublished) {
      return NextResponse.json(
        { error: "Ejercicio no encontrado" },
        { status: 404 }
      );
    }

    const media = await prisma.exerciseMedia.findMany({
      where: { exerciseId: params.id },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json(media);

  } catch (error) {
    console.error("Error al obtener media:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
