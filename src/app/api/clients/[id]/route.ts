import { NextRequest, NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";
import { z } from "zod";

const clientUpdateSchema = z.object({
  firstName: z.string().min(1, "El nombre es obligatorio"),
  lastName: z.string().min(1, "El apellido es obligatorio"),
  plan: z.enum(["Sin plan", "Mensual", "Básico", "Pro", "Elite"]),
  startDate: z
    .string()
    .nullable()
    .or(z.literal(""))
    .transform((val) => (val ? new Date(val) : null)),
  endDate: z
    .string()
    .nullable()
    .or(z.literal(""))
    .transform((val) => (val ? new Date(val) : null)),
  phone: z.string().optional().or(z.literal("")),
  emergencyPhone: z.string().optional().default(""),
});

// PUT: Actualizar cliente por ID
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!params.id) {
      return NextResponse.json(
        { error: "El ID del cliente es inválido o no está presente" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validatedData = clientUpdateSchema.parse(body);

    const clientProfile = await prisma.clientProfile.findUnique({
      where: { profile_id: params.id },
    });
    if (!clientProfile) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    // Transacción
    const [updatedProfile, updatedUser] = await prisma.$transaction([
      prisma.clientProfile.update({
        where: { profile_id: params.id },
        data: {
          profile_first_name: validatedData.firstName,
          profile_last_name: validatedData.lastName,
          profile_plan: validatedData.plan,
          profile_start_date: validatedData.startDate,
          profile_end_date: validatedData.endDate,
          profile_phone: validatedData.phone || null,
          profile_emergency_phone: validatedData.emergencyPhone,
        },
      }),
      prisma.user.update({
        where: { id: clientProfile.user_id },
        data: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          // Ojo, no siempre username = firstName, revisa tu lógica
          // si quieres actualizar username, haz un input "newUsername"
        },
      }),
    ]);

    return NextResponse.json(
      { message: "Cliente actualizado con éxito", updatedProfile, updatedUser },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al actualizar cliente:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar cliente
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Desestructura y espera la promesa:
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "El ID del cliente es inválido" },
      { status: 400 }
    );
  }

  const client = await prisma.clientProfile.findUnique({
    where: { profile_id: id },
  });

  if (!client) {
    return NextResponse.json(
      { error: "Cliente no encontrado" },
      { status: 404 }
    );
  }
  await prisma.clientProfile.delete({ where: { profile_id: id } });
  await prisma.user.delete({ where: { id: client.user_id } });

  return NextResponse.json(
    { message: "Cliente eliminado con éxito" },
    { status: 200 }
  );
  try {
  } catch (error) {
    console.error("Error al eliminar cliente:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
