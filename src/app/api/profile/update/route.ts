import { NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";

export async function PATCH(request: Request) {
  try {
    // Obtener sesión del usuario autenticado
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { firstName, lastName, phone, email } = await request.json();

    // Validaciones de entrada
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "Todos los campos son obligatorios" },
        { status: 400 }
      );
    }

    // Verificar si el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si el perfil existe
    const existingProfile = await prisma.clientProfile.findUnique({
      where: { user_id: session.user.id },
    });

    if (!existingProfile) {
      return NextResponse.json(
        { error: "Perfil no encontrado" },
        { status: 404 }
      );
    }

    // Actualizar usuario en la tabla User
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: firstName, // 🔹 Actualiza también el nombre
        lastName: lastName, // 🔹 Actualiza también el apellido
        email: email,
      },
    });

    // Actualizar perfil en ClientProfile
    const updatedProfile = await prisma.clientProfile.update({
      where: { user_id: session.user.id },
      data: {
        profile_first_name: firstName,
        profile_last_name: lastName,
        profile_phone: phone,
      },
    });

    return NextResponse.json({ success: true, updatedUser, updatedProfile });
  } catch (error) {
    console.error("❌ Error al actualizar el perfil:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
