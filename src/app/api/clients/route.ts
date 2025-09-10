// src/app/api/clients/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";
import { z, ZodError } from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getToken } from "next-auth/jwt";

const clientSchema = z.object({
  firstName: z.string().min(1, { message: "El nombre es obligatorio" }),
  lastName: z.string().min(1, { message: "El apellido es obligatorio" }),
  username: z.string().min(1, { message: "El usuario es obligatorio" }),
  plan: z.enum(["Mensual", "Básico", "Pro", "Elite"]),

  membershipStart: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: "Fecha de inicio inválida",
    }),
  membershipEnd: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: "Fecha de fin inválida",
    }),

  phone: z.string().min(9, { message: "Teléfono inválido" }),

  // Permitir vacío u omitido
  emergencyPhone: z.string().optional().or(z.literal("")),

  // Campos nuevos
  address: z.string().optional().or(z.literal("")),
  social: z.string().optional().or(z.literal("")),
});

// GET /api/clients - lista de clientes
export async function GET(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token || token.role !== "admin") {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const clients = await prisma.clientProfile.findMany({
      orderBy: { profile_start_date: "desc" },
      // 👇 SOLO columnas que ya existen en tu DB
      select: {
        profile_id: true,
        user_id: true,
        profile_first_name: true,
        profile_last_name: true,
        profile_plan: true,
        profile_start_date: true,
        profile_end_date: true,
        profile_phone: true,
        profile_emergency_phone: true,
        profile_address: true,
        profile_social: true,
        user: { select: { id: true, role: true, username: true } },
      },
    });

    return NextResponse.json(clients, { status: 200 });
  } catch (error) {
    console.error("Error GET /api/clients:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST /api/clients - registra un cliente con plan y contraseña temporal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = clientSchema.parse(body);

    // Validar teléfonos
    const phoneNumber = parsePhoneNumberFromString(validatedData.phone, "PE");
    if (!phoneNumber?.isValid()) {
      return NextResponse.json(
        { error: "El teléfono principal no es válido" },
        { status: 400 }
      );
    }

    if (validatedData.emergencyPhone) {
      const emergNum = parsePhoneNumberFromString(
        validatedData.emergencyPhone,
        "PE"
      );
      if (emergNum && !emergNum.isValid()) {
        return NextResponse.json(
          { error: "El teléfono de emergencia no es válido" },
          { status: 400 }
        );
      }
    }

    // Verificar username único
    const existingUser = await prisma.user.findUnique({
      where: { username: validatedData.username },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "El usuario ya está registrado." },
        { status: 400 }
      );
    }

    // Generar contraseña temporal
    const generatedPassword = crypto.randomBytes(6).toString("hex");
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    // Crear user + profile
    const user = await prisma.user.create({
      data: {
        username: validatedData.username,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        password: hashedPassword,
        role: "client",
        phoneNumber: validatedData.phone,
      },
    });

    // En el endpoint POST /api/clients
    const clientProfile = await prisma.clientProfile.create({
      data: {
        profile_first_name: validatedData.firstName,
        profile_last_name: validatedData.lastName,
        profile_plan: validatedData.plan,
        profile_start_date:
          validatedData.membershipStart && validatedData.membershipStart !== ""
            ? new Date(validatedData.membershipStart)
            : null,
        profile_end_date:
          validatedData.membershipEnd && validatedData.membershipEnd !== ""
            ? new Date(validatedData.membershipEnd)
            : null,

        profile_phone: validatedData.phone,
        profile_emergency_phone: validatedData.emergencyPhone || null,
        profile_address: validatedData.address || null,
        profile_social: validatedData.social || null,
        user: { connect: { id: user.id } },
      },
    });

    return NextResponse.json(
      {
        message: "Cliente registrado con éxito",
        clientProfile,
        tempPassword: generatedPassword, // Se retorna la contraseña en texto plano
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }
    // Prisma unique constraint
    if (error.code === "P2002") {
      const fields = (error.meta?.target as string[]) ?? [];
      const msg = fields.includes("username")
        ? "El usuario ya está registrado"
        : fields.includes("phoneNumber")
          ? "El teléfono ya está registrado"
          : "Registro duplicado";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    console.error("❌ Error al crear cliente:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
