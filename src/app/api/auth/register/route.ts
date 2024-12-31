// /app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/libs/prisma";
import nodemailer from "nodemailer";
import { randomBytes } from "crypto"; 

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// -- Configuración nodemailer
async function sendVerificationEmail(email: string, token: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "",
    port: Number(process.env.EMAIL_PORT || 587),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER || "",
      pass: process.env.EMAIL_PASS || "",
    },
  });

  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`;
  const mailOptions = {
    from: `"Wolf Gym" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verifica tu correo - Wolf Gym",
    html: `
      <h1>¡Bienvenido a Wolf Gym!</h1>
      <p>Por favor, haz clic en el siguiente enlace para verificar tu cuenta:</p>
      <a href="${verificationUrl}">Verificar cuenta</a>
      <p>Si no solicitaste esto, ignora este correo.</p>
    `,
  };

  // Enviar correo
  await transporter.sendMail(mailOptions);
  console.log(`Correo de verificación enviado a ${email}`);
}

export async function POST(req: Request) {
  try {
    const { username, email, password, plan, startDate, endDate } =
      await req.json();

    // 1. Validar campos
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

    // 2. Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { message: "El correo ya está registrado" },
        { status: 400 }
      );
    }

    // 3. Encriptar la contraseña y generar token
    const hashedPassword = await bcrypt.hash(password, 10);
    const token = randomBytes(32).toString("hex");

    // 4. Enviar correo de verificación ANTES de crear el usuario
    //    Si aquí falla, no guardamos nada en la BD
    await sendVerificationEmail(email, token);

    // 5. Ahora creamos el usuario en la BD
    const user = await prisma.user.create({
      data: {
        name: username,
        email,
        password: hashedPassword,
        role: "client",
        emailVerified: false, // Aún no verificado
      },
    });

    // 6. Crear el perfil del cliente
    await prisma.clientProfile.create({
      data: {
        profile_first_name: username,
        profile_last_name: "", // Ajusta según necesites
        profile_plan: plan || undefined,
        ...(startDate && { profile_start_date: new Date(startDate) }),
        ...(endDate && { profile_end_date: new Date(endDate) }),
        profile_phone: "", // Ajusta si tienes datos reales
        profile_emergency_phone: "", // Ajusta si tienes datos reales
        user_id: user.id,
      },
    });

    // 7. Guardar el token en la tabla VerificationToken
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // 8. Respuesta de éxito
    return NextResponse.json(
      {
        message:
          "Usuario registrado con éxito. Revisa tu correo para verificar la cuenta.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error al registrar el usuario:", error);

    // Si se repite el correo
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
