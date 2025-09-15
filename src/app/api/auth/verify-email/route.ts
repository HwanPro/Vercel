import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { email, userId, type = "code" } = await req.json();

    if (!email || !userId) {
      return NextResponse.json(
        { error: "Email y userId son requeridos" },
        { status: 400 }
      );
    }

    // Check if email is already in use by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        username: email,
        NOT: { id: userId }
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este email ya está en uso por otro usuario" },
        { status: 400 }
      );
    }

    // Generate verification code or token
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store verification data (using raw query until Prisma is regenerated)
    await prisma.$executeRaw`
      INSERT INTO email_verifications (id, "userId", email, code, token, verified, "expiresAt", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${userId}, ${email}, ${verificationCode}, ${verificationToken}, false, ${expiresAt}, NOW(), NOW())
      ON CONFLICT ("userId") 
      DO UPDATE SET 
        email = ${email},
        code = ${verificationCode},
        token = ${verificationToken},
        "expiresAt" = ${expiresAt},
        verified = false,
        "updatedAt" = NOW()
    `;

    // Send verification email
    const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: "Verificación de Email - Wolf Gym",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">Verificación de Email</h2>
          <p>Hola,</p>
          <p>Has solicitado cambiar tu nombre de usuario por este email. Para completar el proceso, necesitamos verificar tu dirección de correo.</p>
          
          ${type === "code" ? `
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h3 style="margin: 0; color: #1f2937;">Tu código de verificación:</h3>
              <div style="font-size: 32px; font-weight: bold; color: #3b82f6; margin: 10px 0;">${verificationCode}</div>
              <p style="margin: 0; color: #6b7280;">Este código expira en 15 minutos</p>
            </div>
          ` : `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Verificar Email
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:<br>
              <a href="${verificationUrl}">${verificationUrl}</a>
            </p>
          `}
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Si no solicitaste este cambio, puedes ignorar este email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Wolf Gym - Sistema de Gestión
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: type === "code" 
        ? "Código de verificación enviado a tu email" 
        : "Link de verificación enviado a tu email",
      type
    });

  } catch (error) {
    console.error("Error sending verification email:", error);
    return NextResponse.json(
      { error: "Error al enviar el email de verificación" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId, code, token } = await req.json();

    if (!userId || (!code && !token)) {
      return NextResponse.json(
        { error: "Datos de verificación incompletos" },
        { status: 400 }
      );
    }

    // Find verification record (using raw query until Prisma is regenerated)
    const verification = userId 
      ? await prisma.$queryRaw`SELECT * FROM email_verifications WHERE "userId" = ${userId} LIMIT 1`
      : await prisma.$queryRaw`SELECT * FROM email_verifications WHERE token = ${token} LIMIT 1`;
    
    const verificationRecord = Array.isArray(verification) ? verification[0] : null;

    if (!verificationRecord) {
      return NextResponse.json(
        { error: "No se encontró solicitud de verificación" },
        { status: 404 }
      );
    }

    // Check if expired
    if (verificationRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "El código/token de verificación ha expirado" },
        { status: 400 }
      );
    }

    // Verify code or token
    if (code && verificationRecord.code !== code) {
      return NextResponse.json(
        { error: "Código o token de verificación inválido" },
        { status: 400 }
      );
    }

    // Update user's username to email
    await prisma.user.update({
      where: { id: verificationRecord.userId },
      data: { username: verificationRecord.email },
    });

    // Mark as verified (using raw query until Prisma is regenerated)
    await prisma.$executeRaw`
      UPDATE email_verifications 
      SET verified = true, "updatedAt" = NOW() 
      WHERE "userId" = ${verificationRecord.userId}
    `;

    return NextResponse.json({
      success: true,
      message: "Email verificado exitosamente. Tu nombre de usuario ha sido actualizado."
    });

  } catch (error) {
    console.error("Error verifying email:", error);
    return NextResponse.json(
      { error: "Error al verificar el email" },
      { status: 500 }
    );
  }
}
