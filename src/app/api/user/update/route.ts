import { NextRequest, NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";
import { getToken } from "next-auth/jwt";

export async function PATCH(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { username, firstName, lastName, phone, emergencyPhone } =
      await request.json();

    // Aquí ya no exigimos a la fuerza todos, puedes condicionar:
    if (!username || !firstName || !lastName || !phone) {
      return NextResponse.json(
        {
          error:
            "Faltan campos obligatorios (username, firstName, lastName, phone)",
        },
        { status: 400 }
      );
    }

    // Actualizar la tabla User
    await prisma.user.update({
      where: { id: token.id as string },
      data: {
        username,
        firstName,
        lastName,
        phoneNumber: phone,
      },
    });

    // Verificar si existe ClientProfile
    const profile = await prisma.clientProfile.findUnique({
      where: { user_id: token.id as string },
    });

    if (!profile) {
      // Si no existe, lo creas si lo deseas
      await prisma.clientProfile.create({
        data: {
          user_id: token.id as string,
          profile_first_name: firstName,
          profile_last_name: lastName,
          profile_phone: phone,
          profile_emergency_phone: emergencyPhone || null,
        },
      });
    } else {
      // Actualizarlo
      await prisma.clientProfile.update({
        where: { user_id: token.id as string },
        data: {
          profile_first_name: firstName,
          profile_last_name: lastName,
          profile_phone: phone,
          profile_emergency_phone: emergencyPhone || null,
        },
      });
    }

    return NextResponse.json(
      { message: "Perfil actualizado con éxito" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error PATCH /api/user/update:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
