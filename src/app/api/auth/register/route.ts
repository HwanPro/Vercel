import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/libs/prisma";

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export async function POST(req: Request) {
  try {
    const { username, email, password, plan, startDate, endDate } =
      await req.json();

    // Validar campos obligatorios
    if (!username || !email || !password) {
      return NextResponse.json(
        { message: "Todos los campos son obligatorios" },
        { status: 400 }
      );
    }

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Introduce un correo electrónico válido" },
        { status: 400 }
      );
    }

    if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s])[A-Za-z\d@$!%*?&#\-\_\.]{12,}$/.test(
        password
      )
    ) {
      return NextResponse.json(
        { message: "La contraseña no cumple con los requisitos de seguridad." },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { message: "El correo ya está registrado" },
        { status: 400 }
      );
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario
    const user = await prisma.user.create({
      data: {
        name: username,
        email,
        password: hashedPassword,
        role: "client",
        emailVerified: true, // Cambiar a true para evitar la verificación
      },
    });

    // Crear el perfil del cliente
    await prisma.clientProfile.create({
      data: {
        profile_first_name: username,
        profile_last_name: "",
        profile_plan: plan || undefined,
        ...(startDate && { profile_start_date: new Date(startDate) }), // Solo agrega si existe
        ...(endDate && { profile_end_date: new Date(endDate) }), // Solo agrega si existe
        profile_phone: "",
        profile_emergency_phone: "",
        user_id: user.id,
      },
    });

    // Respuesta de éxito
    return NextResponse.json(
      { message: "Usuario registrado con éxito." },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error al registrar el usuario:", error);

    // Identificar posibles errores de Prisma
    if (error.code === "P2002") {
      return NextResponse.json(
        { message: "El correo ya está registrado." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Error al registrar el usuario. Inténtalo nuevamente." },
      { status: 500 }
    );
  }
}
