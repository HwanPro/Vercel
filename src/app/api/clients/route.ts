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
  plan: z.enum(["Mensual", "Promoción Básica", "Promoción Premium", "Promoción VIP"]),
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
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || token.role !== "admin") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const clients = await prisma.clientProfile.findMany({
      take: 10,
      orderBy: { profile_start_date: "desc" },
      include: { user: true },
    });

    return NextResponse.json(clients, { status: 200 });
  } catch (error) {
    console.error("Error al obtener los clientes:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Función POST
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = clientSchema.parse(body);

    const phoneNumber = parsePhoneNumberFromString(validatedData.phone, "PE");
    const emergencyPhoneNumber = parsePhoneNumberFromString(
      validatedData.emergencyPhone,
      "PE"
    );

    if (!phoneNumber?.isValid() || !emergencyPhoneNumber?.isValid()) {
      return NextResponse.json(
        { error: "Número de teléfono o emergencia no es válido" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash("defaultPassword123", 10);

    const user = await prisma.user.create({
      data: {
        name: `${validatedData.firstName} ${validatedData.lastName}`,
        email: validatedData.email,
        role: "client",
        password: hashedPassword,
      },
    });

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

    return NextResponse.json(
      { message: "Cliente registrado con éxito", clientProfile },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error interno:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
