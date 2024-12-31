// /app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/libs/prisma";
import emailExistence from "email-existence";
import nodemailer from "nodemailer";
import { randomBytes } from "crypto"; // Para generar un token random

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

    // Validación de formato de email (regex)
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Introduce un correo electrónico válido (formato)" },
        { status: 400 }
      );
    }

    // Validación más profunda con SMTP (email-existence)
    const emailEsValidoSMTP = await new Promise<boolean>((resolve) => {
      emailExistence.check(email, (err: any, res: boolean) => {
        if (err) {
          console.log("Error en email-existence:", err);
          // Podrías decidir si ignoras este error y sigues, o rechazas.
          return resolve(false);
        }
        resolve(res);
      });
    });

    if (!emailEsValidoSMTP) {
      return NextResponse.json(
        { message: "El correo electrónico no parece existir realmente." },
        { status: 400 }
      );
    }

    // Validar contraseña
    if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s])[A-Za-z\d\-\_\.]{12,}$/.test(
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

    // Crear el usuario con emailVerified = null (a la espera de confirmación)
    const user = await prisma.user.create({
      data: {
        name: username,
        email,
        password: hashedPassword,
        role: "client",
        emailVerified: false, // O null para indicar que NO está verificado
      },
    });

    // Crear el perfil del cliente
    await prisma.clientProfile.create({
      data: {
        profile_first_name: username,
        profile_plan: plan || undefined,
        ...(startDate && { profile_start_date: new Date(startDate) }),
        ...(endDate && { profile_end_date: new Date(endDate) }),
        user_id: user.id,
      },
    });

    // Generar un token de verificación
    const token = randomBytes(32).toString("hex");

    // Almacenar el token en la base de datos, por ejemplo, en una tabla VerificationToken
    // O en la tabla user si tienes una columna verificationToken
    // Aquí asumimos que tienes un modelo "verificationToken"
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24), // Expira en 24h
      },
    });

    // Enviar correo de verificación
    await enviarCorreoVerificacion(email, token);

    return NextResponse.json(
      {
        message:
          "Usuario registrado con éxito. Revisa tu correo para verificar la cuenta.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error al registrar el usuario:", error);

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

// Función para enviar el correo de verificación con nodemailer
async function enviarCorreoVerificacion(email: string, token: string) {
  // Crea un transporter con tu servicio SMTP
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false, // o true si usas TLS/SSL
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`;

  const mailOptions = {
    from: '"Wolf Gym" <no-reply@wolfgym.com>',
    to: email,
    subject: "Verifica tu correo - Wolf Gym",
    html: `
      <h1>¡Bienvenido a Wolf Gym!</h1>
      <p>Por favor, haz clic en el siguiente enlace para verificar tu cuenta:</p>
      <a href="${verificationUrl}">Verificar cuenta</a>
      <p>Si no solicitaste esto, ignora este correo.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`Correo de verificación enviado a ${email}`);
}
