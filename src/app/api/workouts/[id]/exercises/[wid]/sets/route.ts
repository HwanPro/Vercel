import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Esquema de validación para agregar serie
const addWorkoutSetSchema = z.object({
  setIndex: z.number().min(1),
  weight: z.number().min(0),
  reps: z.number().min(1),
  rpe: z.number().min(1).max(10).optional(),
  isWarmup: z.boolean().default(false),
  restSec: z.number().min(0).optional(),
  note: z.string().optional()
});

// POST - Agregar serie a ejercicio
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string, wid: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const data = addWorkoutSetSchema.parse(body);

    // Verificar que el ejercicio del entrenamiento existe y pertenece al usuario
    const workoutExercise = await prisma.workoutExercise.findUnique({
      where: { id: params.wid },
      include: {
        workoutSession: true
      }
    });

    if (!workoutExercise || 
        workoutExercise.workoutSession.userId !== session.user.id ||
        workoutExercise.workoutSessionId !== params.id) {
      return NextResponse.json(
        { error: "Ejercicio de entrenamiento no encontrado" },
        { status: 404 }
      );
    }

    if (workoutExercise.workoutSession.status === 'completed') {
      return NextResponse.json(
        { error: "No se puede modificar un entrenamiento completado" },
        { status: 400 }
      );
    }

    // Verificar si ya existe una serie con ese índice
    const existingSet = await prisma.workoutSet.findFirst({
      where: {
        workoutExerciseId: params.wid,
        setIndex: data.setIndex
      }
    });

    if (existingSet) {
      // Actualizar serie existente
      const updatedSet = await prisma.workoutSet.update({
        where: { id: existingSet.id },
        data: {
          weight: data.weight,
          reps: data.reps,
          rpe: data.rpe,
          isWarmup: data.isWarmup,
          restSec: data.restSec,
          note: data.note,
          completedAt: new Date()
        }
      });

      return NextResponse.json({ id: updatedSet.id });
    } else {
      // Crear nueva serie
      const workoutSet = await prisma.workoutSet.create({
        data: {
          workoutExerciseId: params.wid,
          setIndex: data.setIndex,
          weight: data.weight,
          reps: data.reps,
          rpe: data.rpe,
          isWarmup: data.isWarmup,
          restSec: data.restSec,
          note: data.note
        }
      });

      return NextResponse.json({ id: workoutSet.id });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error al agregar serie:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// GET - Obtener series de un ejercicio
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string, wid: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que el ejercicio del entrenamiento existe y pertenece al usuario
    const workoutExercise = await prisma.workoutExercise.findUnique({
      where: { id: params.wid },
      include: {
        workoutSession: true
      }
    });

    if (!workoutExercise || 
        workoutExercise.workoutSession.userId !== session.user.id ||
        workoutExercise.workoutSessionId !== params.id) {
      return NextResponse.json(
        { error: "Ejercicio de entrenamiento no encontrado" },
        { status: 404 }
      );
    }

    const sets = await prisma.workoutSet.findMany({
      where: { workoutExerciseId: params.wid },
      orderBy: { setIndex: 'asc' }
    });

    return NextResponse.json(sets);

  } catch (error) {
    console.error("Error al obtener series:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
