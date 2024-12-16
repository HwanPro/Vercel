import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/libs/prisma';
import { sendVerificationEmail } from '@/libs/mail';
import { generateVerificationToken } from '@/utils/auth';

export async function POST(req: Request) {
  try {
    const { username, email, password, plan, startDate, endDate } = await req.json();

    // Validar campos obligatorios
    if (!username || !email || !password) {
      return NextResponse.json(
        { message: 'Todos los campos son obligatorios' },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { message: 'El correo ya está registrado' },
        { status: 400 }
      );
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario
    const user = await prisma.user.create({
      data: {
        name: username,
        email,
        password: hashedPassword,
        role: 'client',
      },
    });

    // Crear el perfil del cliente
    await prisma.clientProfile.create({
      data: {
        profile_first_name: username,
        profile_last_name: '',
        profile_plan: plan || undefined,
        ...(startDate && { profile_start_date: new Date(startDate) }), // Solo agrega si existe
        ...(endDate && { profile_end_date: new Date(endDate) }), // Solo agrega si existe
        profile_phone: '',
        profile_emergency_phone: '',
        user_id: user.id,
      },
    });
       

    // Generar token de verificación
    const token = generateVerificationToken();
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Enviar correo de verificación
    try {
      await sendVerificationEmail(email, token);
    } catch (emailError) {
      console.error('Error al enviar el correo:', emailError);
      return NextResponse.json(
        { message: 'Error al enviar el correo de verificación' },
        { status: 500 }
      );
    }

    // Respuesta de éxito
    return NextResponse.json(
      { message: 'Usuario registrado con éxito. Revisa tu correo para verificar la cuenta.' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error al registrar el usuario:', error);

    // Identificar posibles errores de Prisma
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: 'El correo ya está registrado.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Error al registrar el usuario. Inténtalo nuevamente.' },
      { status: 500 }
    );
  }
}
