// src/app/api/admin/update-user/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";
import { getToken } from "next-auth/jwt";

export async function PATCH(request: NextRequest) {
  try {
    // Obtenemos el token de la sesión y verificamos que sea un admin
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token || token.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Parsear el body y extraer los campos necesarios
    const { userId, username, firstName, lastName, phone, emergencyPhone } =
      await request.json();
    if (!userId || !username || !firstName || !lastName || !phone) {
      return NextResponse.json(
        {
          error:
            "Faltan campos obligatorios (userId, username, firstName, lastName, phone)",
        },
        { status: 400 }
      );
    }

    // Actualizar el usuario en la tabla User
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username,
        firstName,
        lastName,
        phoneNumber: phone,
      },
    });

    // Actualizar (o crear) el ClientProfile, si existe
    try {
      const profile = await prisma.clientProfile.findUnique({
        where: { user_id: userId },
      });

      if (profile) {
        await prisma.clientProfile.update({
          where: { user_id: userId },
          data: {
            profile_first_name: firstName,
            profile_last_name: lastName,
            profile_phone: phone,
            profile_emergency_phone: emergencyPhone || null,
          },
        });
      }
    } catch (profileError) {
      console.error("Error al actualizar ClientProfile:", profileError);
      // Si falla actualizar el profile, no detenemos la operación principal
    }

    return NextResponse.json(
      { message: "Usuario actualizado con éxito", user: updatedUser },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error PATCH /api/admin/update-user:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
