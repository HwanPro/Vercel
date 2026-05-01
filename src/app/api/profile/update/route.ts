import { NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { z, ZodError } from "zod";

// Definimos un esquema Zod para validar los datos que llegan en el body
const updateProfileSchema = z.object({
  username: z.string().min(1, "El nombre de usuario es obligatorio"),
  firstName: z.string().min(1, "El nombre es obligatorio"),
  lastName: z.string().min(1, "El apellido es obligatorio"),
  phone: z.string().min(1, "El teléfono es obligatorio"),
  emergencyPhone: z.string().optional().or(z.literal("")),
  documentNumber: z.string().optional().or(z.literal("")),
  dni: z.string().optional().or(z.literal("")),
});

export async function PATCH(request: Request) {
  try {
    // Obtener la sesión del usuario autenticado
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Parsear y validar el body con Zod
    const body = await request.json();
    const { username, firstName, lastName, phone, emergencyPhone, documentNumber, dni } =
      updateProfileSchema.parse(body);
    const cleanedDocument = String(documentNumber || dni || "").replace(/\D/g, "");

    if (cleanedDocument && cleanedDocument.length !== 8) {
      return NextResponse.json(
        { error: "El DNI debe tener 8 dígitos" },
        { status: 400 }
      );
    }

    // Verificar si el usuario existe en la tabla User
    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si existe el perfil en ClientProfile
    const existingProfile = await prisma.clientProfile.findUnique({
      where: { user_id: session.user.id },
    });
    if (!existingProfile) {
      return NextResponse.json(
        { error: "Perfil no encontrado" },
        { status: 404 }
      );
    }

    if (cleanedDocument) {
      const duplicatedDocument = await prisma.clientProfile.findFirst({
        where: {
          documentNumber: cleanedDocument,
          NOT: { user_id: session.user.id },
        },
        select: { profile_id: true },
      });

      if (duplicatedDocument) {
        return NextResponse.json(
          { error: "El DNI ya está registrado" },
          { status: 409 }
        );
      }
    }

    // Usamos una transacción para actualizar ambas tablas
    const [updatedUser, updatedProfile] = await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          username: username,
          firstName: firstName,
          lastName: lastName,
          phoneNumber: phone,
        },
      }),
      prisma.clientProfile.update({
        where: { user_id: session.user.id },
        data: {
          // Actualizamos campos en ClientProfile
          profile_first_name: firstName,
          profile_last_name: lastName,
          profile_phone: phone,
          profile_emergency_phone: emergencyPhone || null,
          documentNumber: cleanedDocument || null,
        },
      }),
    ]);

    return NextResponse.json(
      { success: true, updatedUser, updatedProfile },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      // Si falla la validación de Zod, devolvemos detalles del error
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }
    console.error("❌ Error al actualizar el perfil:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
