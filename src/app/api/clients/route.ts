// src/app/api/clients/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/libs/prisma';
import { z } from 'zod';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authOptions'; // Importar desde el nuevo archivo
import bcrypt from 'bcryptjs';

// Esquema de validación con Zod
const clientSchema = z.object({
  firstName: z.string().min(1, 'El nombre es obligatorio'),
  lastName: z.string().min(1, 'El apellido es obligatorio'),
  plan: z.enum(['Básico', 'Premium', 'VIP']),
  startDate: z.string(),
  endDate: z.string(),
  phone: z.string(),
  emergencyPhone: z.string(),
  email: z.string().email('Correo electrónico inválido'),
});

// Función GET
export async function GET(request: NextRequest) {
  try {
    // Verificar la sesión y el rol del usuario
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    // Obtener los clientes recientes (ejemplo: los últimos 10 clientes)
    const clients = await prisma.clientProfile.findMany({
      take: 10,
      orderBy: {
        profile_start_date: 'desc',
      },
      include: {
        user: true, // Para obtener el email y otros datos del usuario
      },
    });

    return NextResponse.json(clients, { status: 200 });
  } catch (error) {
    console.error('Error al obtener los clientes:', error);
    return NextResponse.json(
      { message: 'Error al obtener los clientes' },
      { status: 500 }
    );
  }
}

// Función POST
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = clientSchema.parse(body);

    // Validación de números de teléfono
    const phoneNumber = parsePhoneNumberFromString(validatedData.phone, 'PE');
    const emergencyPhoneNumber = parsePhoneNumberFromString(
      validatedData.emergencyPhone,
      'PE'
    );

    if (!phoneNumber?.isValid()) {
      return NextResponse.json(
        { error: 'El número de teléfono no es válido' },
        { status: 400 }
      );
    }

    if (!emergencyPhoneNumber?.isValid()) {
      return NextResponse.json(
        { error: 'El número de emergencia no es válido' },
        { status: 400 }
      );
    }

    // Hashear la contraseña predeterminada
    const defaultPassword = 'defaultPassword123'; // Esto es solo un ejemplo, asegúrate de reemplazar esto por una lógica segura.
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Crear el usuario en la tabla User
    const user = await prisma.user.create({
      data: {
        name: `${validatedData.firstName} ${validatedData.lastName}`,
        email: validatedData.email,
        role: 'client',
        password: hashedPassword, // Agregar contraseña hasheada
      },
    });

    // Crear el perfil del cliente en ClientProfile
    const clientProfile = await prisma.clientProfile.create({
      data: {
        profile_first_name: validatedData.firstName,
        profile_last_name: validatedData.lastName,
        profile_plan: validatedData.plan,
        profile_start_date: new Date(validatedData.startDate),
        profile_end_date: new Date(validatedData.endDate),
        profile_phone: validatedData.phone,
        profile_emergency_phone: validatedData.emergencyPhone,
        user_id: user.id,
      },
    });

    const response = {
      user,
      clientProfile,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error al guardar cliente:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
