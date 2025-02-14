import { NextRequest, NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { z, ZodError } from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { getToken } from "next-auth/jwt";
import bcrypt from "bcryptjs";
import { sendManualCredentialsEmail } from "@/libs/mail";

const clientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  plan: z.enum([
    "Mensual",
    "Promoción Básica",
    "Promoción Premium",
    "Promoción VIP",
  ]),
  membershipStart: z.string().refine((date) => !isNaN(Date.parse(date))),
  membershipEnd: z.string().refine((date) => !isNaN(Date.parse(date))),
  phone: z.string().min(9),
  emergencyPhone: z.string().min(9),
  email: z.string().email(),
});

export async function GET(request: NextRequest) {
  console.log("⏳ Iniciando GET /api/clients...");

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token || token.role !== "admin") {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const clients = await prisma.clientProfile.findMany({
      take: 10,
      orderBy: { profile_start_date: "desc" },
      include: { user: true },
    });
    return NextResponse.json(clients, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

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

    const generatedPassword = Math.random().toString(36).slice(-10);
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "El correo ya está registrado." },
        { status: 400 }
      );
    }

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
        profile_start_date: new Date(validatedData.membershipStart),
        profile_end_date: new Date(validatedData.membershipEnd),
        profile_phone: validatedData.phone,
        profile_emergency_phone: validatedData.emergencyPhone,
        user: { connect: { id: user.id } },
      },
    });

    const verificationToken = await prisma.verificationToken.create({
      data: {
        identifier: validatedData.email,
        token: Math.random().toString(36).slice(-10),
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await sendManualCredentialsEmail(
      validatedData.email,
      validatedData.firstName,
      generatedPassword,
      verificationToken.token
    );

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
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
