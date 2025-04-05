// src/app/api/auth/register/route.ts

import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/infrastructure/prisma/prisma";

export async function POST(req: Request) {
  try {
    const { firstname, username, lastname, password, phone } = await req.json();

    // Validar campos requeridos
    if (!firstname || !username || !lastname || !password) {
      return NextResponse.json(
        {
          message: "Los campos firstname, username, lastname y password son obligatorios",
        },
        { status: 400 }
      );
    }

    // Verificar si ya existe un usuario con el mismo username
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUser) {
      return NextResponse.json(
        { message: "El usuario ya está registrado" },
        { status: 400 }
      );
    }

    // Si se proporciona teléfono, verificar duplicados en ClientProfile (si aplica)
    if (phone) {
      const existingPhone = await prisma.clientProfile.findUnique({
        where: {
          profile_id: phone // Using profile_id as the unique identifier
        },
      });
      if (existingPhone) {
        return NextResponse.json(
          { message: "El teléfono ya está registrado" },
          { status: 400 }
        );
      }
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario y su ClientProfile asociado
    const user = await prisma.user.create({
      data: {
        firstName: firstname,
        username,
        lastName: lastname,
        password: hashedPassword,
        role: "client",
        phoneNumber: phone || null,
        profile: {
          create: {
            profile_first_name: username,
            profile_last_name: lastname,
            profile_phone: phone || null,
          },
        },
      },
    });

    return NextResponse.json(
      { message: "Usuario registrado con éxito", user },
      { status: 201 }
    );
  } catch (error: Error | unknown) {
    console.error("🚨 ERROR EN REGISTRO:", error);
    if ((error as { code?: string }).code === "P2002") {
      const fields = (error as { meta?: { target?: string[] } }).meta?.target;
      return NextResponse.json(
        {
          message: `El valor del campo ${fields} ya está registrado. Usa otro.`,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Error en el registro. Inténtalo nuevamente." },
      { status: 500 }
    );
  }
}
