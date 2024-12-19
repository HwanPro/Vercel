// src/app/api/clients/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { z, ZodError } from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { getToken } from "next-auth/jwt";
import bcrypt from "bcryptjs";

// Esquema de validación con Zod
const clientSchema = z.object({
  firstName: z.string().min(1, "El nombre es obligatorio"),
  lastName: z.string().min(1, "El apellido es obligatorio"),
  plan: z.enum([
    "Mensual",
    "Promoción Básica",
    "Promoción Premium",
    "Promoción VIP",
  ]),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "La fecha de inicio es inválida",
  }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "La fecha de fin es inválida",
  }),
  phone: z.string().min(9, "Teléfono inválido"),
  emergencyPhone: z.string().min(9, "Teléfono de emergencia inválido"),
  email: z.string().email("Correo electrónico inválido"),
});

// Función GET
export async function GET(request: NextRequest) {
  console.log("⏳ Iniciando GET /api/clients...");

  // Log de cookies
  console.log("🛠 Cookies recibidas en GET:", request.headers.get("cookie"));

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  console.log("🔑 Token recibido en GET:", token);

  if (!token || token.role !== "admin") {
    console.log("🚫 Token inválido o usuario no autorizado");
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const clients = await prisma.clientProfile.findMany({
      take: 10,
      orderBy: { profile_start_date: "desc" },
      include: { user: true },
    });

    console.log("✅ Clientes obtenidos:", clients);
    return NextResponse.json(clients, { status: 200 });
  } catch (error) {
    console.error("❌ Error al obtener los clientes:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Función POST
export async function POST(request: NextRequest) {
  console.log("⏳ Iniciando POST /api/clients...");

  try {
    const body = await request.json();
    console.log("📥 Datos recibidos en el cuerpo:", body);

    const validatedData = clientSchema.parse(body);
    console.log("✅ Datos validados correctamente:", validatedData);

    const phoneNumber = parsePhoneNumberFromString(validatedData.phone, "PE");
    const emergencyPhoneNumber = parsePhoneNumberFromString(
      validatedData.emergencyPhone,
      "PE"
    );

    console.log("📞 Validación de teléfono principal:", phoneNumber?.isValid());
    console.log(
      "📞 Validación de teléfono de emergencia:",
      emergencyPhoneNumber?.isValid()
    );

    if (!phoneNumber?.isValid() || !emergencyPhoneNumber?.isValid()) {
      console.log("🚫 Número de teléfono o emergencia no válido");
      return NextResponse.json(
        { error: "Número de teléfono o emergencia no es válido" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash("defaultPassword123", 10);
    console.log("🔐 Contraseña generada correctamente");

    // Crea o encuentra al usuario
    const user = await prisma.user.create({
      data: {
        name: `${validatedData.firstName} ${validatedData.lastName}`,
        email: validatedData.email,
        role: "client",
        password: hashedPassword,
      },
    });

    console.log("✅ Usuario creado:", user);

    // Verifica si el usuario ya tiene un perfil asociado
    const existingProfile = await prisma.clientProfile.findUnique({
      where: { user_id: user.id },
    });

    if (existingProfile) {
      return NextResponse.json(
        { error: "El usuario ya tiene un perfil asociado." },
        { status: 400 }
      );
    }

    // Crea el perfil del cliente
    const clientProfile = await prisma.clientProfile.create({
      data: {
        profile_first_name: validatedData.firstName,
        profile_last_name: validatedData.lastName,
        profile_plan: validatedData.plan,
        profile_start_date: new Date(validatedData.startDate),
        profile_end_date: new Date(validatedData.endDate),
        profile_phone: validatedData.phone,
        profile_emergency_phone: validatedData.emergencyPhone,
        user: {
          connect: { id: user.id },
        },
      },
    });

    console.log("✅ Perfil del cliente creado:", clientProfile);

    return NextResponse.json(
      { message: "Cliente registrado con éxito", clientProfile },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      console.log("🚫 Error de validación Zod:", error.errors);
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }
    console.error("❌ Error interno del servidor:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
