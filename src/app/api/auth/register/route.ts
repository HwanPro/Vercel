// /app/api/auth/register/route.ts

import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/libs/prisma';
import { sendVerificationEmail } from '@/libs/mail';
import { generateVerificationToken } from '@/utils/auth';

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { message: 'Todos los campos son obligatorios' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'El correo ya está registrado' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: username,
        email,
        password: hashedPassword,
        role: 'client',
      },
    });

    // Crear el ClientProfile asociado
    await prisma.clientProfile.create({
      data: {
        profile_first_name: username,
        profile_last_name: '',
        profile_plan: 'Básico',
        profile_start_date: new Date(),
        profile_end_date: new Date(), // Ajusta la fecha según tu lógica
        profile_phone: '',
        profile_emergency_phone: '',
        user_id: user.id,
      },
    });

    // Generar y guardar el token de verificación
    const token = generateVerificationToken();
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // Token válido por 24 horas
      },
    });

    // Enviar el correo de verificación
    await sendVerificationEmail(email, token);

    return NextResponse.json(
      {
        message:
          'Usuario registrado con éxito. Revisa tu correo para verificar la cuenta.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error al registrar el usuario:', error);
    return NextResponse.json(
      { message: 'Error al registrar el usuario' },
      { status: 500 }
    );
  }
}
