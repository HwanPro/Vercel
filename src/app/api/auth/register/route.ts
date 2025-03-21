import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/libs/prisma";
import { randomBytes } from "crypto";
import { sendVerificationEmail } from "@/libs/mail";

export async function POST(req: Request) {
  try {
    const { username, lastname, email, password, phone } = await req.json();
    const normalizedEmail = email.toLowerCase().trim();

    console.log("📩 Recibida solicitud de registro con:", {
      username,
      lastname,
      email,
      phone,
    });

    if (!username || !lastname || !email || !password) {
      return NextResponse.json(
        { message: "Todos los campos son obligatorios" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "El correo ya está registrado" },
        { status: 400 }
      );
    }

    if (phone) {
      const existingPhone = await prisma.clientProfile.findUnique({
        where: { profile_phone: phone },
      });

      if (existingPhone) {
        return NextResponse.json(
          { message: "El teléfono ya está registrado." },
          { status: 400 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = randomBytes(32).toString("hex");

    const user = await prisma.user.create({
      data: {
        name: username,
        lastName: lastname,
        email,
        password: hashedPassword,
        role: "client",
        profile: {
          create: {
            profile_first_name: username,
            profile_last_name: lastname,
            profile_emergency_phone: "",
            profile_phone: phone || null,
          },
        },
      },
    });

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationToken,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await sendVerificationEmail(email, username, verificationToken);

    return NextResponse.json(
      {
        message:
          "Usuario registrado con éxito. Revisa tu correo para verificar la cuenta.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("🚨 ERROR EN REGISTRO:", error);

    if (error.code === "P2002") {
      const fields = error.meta?.target;
      return NextResponse.json(
        {
          message: `El valor del campo ${fields} ya está registrado. Por favor, usa otro.`,
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
