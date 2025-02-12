import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/libs/prisma";
import nodemailer from "nodemailer";
import { randomBytes } from "crypto";

export async function POST(req: Request) {
  try {
    const { username, lastname, email, password } = await req.json();

    console.log("📩 Recibida solicitud de registro con:", {
      username,
      lastname,
      email,
    });

    // 1️⃣ Validar que se ingresen todos los datos
    if (!username || !lastname || !email || !password) {
      console.log("❌ Faltan datos en la solicitud");
      return NextResponse.json(
        { message: "Todos los campos son obligatorios" },
        { status: 400 }
      );
    }

    // 2️⃣ Verificar si el usuario ya existe en la base de datos (IGNORANDO MAYÚSCULAS)
    const existingUser = await prisma.user.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
      },
    });

    if (existingUser) {
      console.log("⚠️ El correo ya está registrado en la BD");
      return NextResponse.json(
        { message: "El correo ya está registrado" },
        { status: 400 }
      );
    }

    // 3️⃣ Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    const token = randomBytes(32).toString("hex");

    console.log("🔒 Contraseña encriptada y token generado");

    // 4️⃣ Crear el usuario
    const user = await prisma.user.create({
      data: {
        name: username,
        lastName: lastname, // <- Asegúrate de que 'lastName' existe en tu modelo
        email,
        password: hashedPassword,
        role: "client",
        emailVerified: false,
      },
    });

    console.log("✅ Usuario creado correctamente:", user);

    // 5️⃣ Enviar correo de verificación
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    console.log("📧 Token de verificación generado y guardado");

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
      return NextResponse.json(
        { message: "El correo ya está registrado." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Error en el registro. Inténtalo nuevamente." },
      { status: 500 }
    );
  }
}
