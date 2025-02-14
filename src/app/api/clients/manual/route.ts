import { NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import bcrypt from "bcrypt";
import { sendManualCredentialsEmail } from "@/libs/mail";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const {
      firstName,
      lastName,
      email,
      plan,
      startDate,
      endDate,
      phone,
      emergencyPhone,
    } = await req.json();

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { message: "El correo ya está registrado." },
        { status: 400 }
      );
    }

    const tempPassword = crypto.randomBytes(6).toString("hex");
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = await prisma.user.create({
      data: {
        name: firstName,
        lastName,
        email,
        password: hashedPassword,
        profile: {
          create: {
            profile_first_name: firstName,
            profile_last_name: lastName,
            profile_plan: plan,
            profile_start_date: new Date(startDate),
            profile_end_date: new Date(endDate),
            profile_phone: phone,
            profile_emergency_phone: emergencyPhone,
          },
        },
      },
    });

    // Generar token de verificación
    const verificationToken = crypto.randomBytes(32).toString("hex");

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationToken,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h de validez
      },
    });

    // Enviar correo con credenciales y verificación
    await sendManualCredentialsEmail(
      email,
      firstName,
      tempPassword,
      verificationToken
    );

    return NextResponse.json(
      { message: "Cliente creado correctamente" },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error al crear cliente manualmente:", error);
    return NextResponse.json(
      { message: "Error al crear el cliente." },
      { status: 500 }
    );
  }
}
