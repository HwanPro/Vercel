//app/api/auth/register/route.ts

"use client"
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/libs/prisma';
import { sendVerificationEmail } from '@/libs/mail';
import { generateVerificationToken } from '@/utils/auth';

export async function POST(req: Request) {
  try {
    const { username, email, password, lastname } = await req.json();

    if (!username || !email || !password || !lastname) {
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
        profile_last_name: lastname,
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


// /app/auth/register/page.tsx

'use client';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type RegisterData = {
  username: string;
  lastname: string;
  email: string;
  password: string;
  confirmPassword: string;
};

function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterData>();
  const router = useRouter();
  const [error, setError] = useState('');

  const onSubmit = handleSubmit(async (data) => {
    if (data.password !== data.confirmPassword) {
      return setError('Las contraseñas no coinciden');
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: data.username,
          lastname: data.lastname,
          email: data.email,
          password: data.password,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        router.push('/auth/login');
      } else {
        const result = await res.json();
        setError(result.message || 'Error en el registro, por favor inténtalo de nuevo');
      }
    } catch {
      setError('Error en el registro, por favor inténtalo de nuevo');
    }
  });

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={onSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-md">
        {error && <p className="bg-red-500 text-white p-3 rounded mb-2">{error}</p>}

        <h1 className="text-black text-2xl font-bold text-center mb-6">Registro</h1>

        <label htmlFor="username" className="text-slate-500 mb-2 block text-sm">
          Nombre de usuario:
        </label>
        <input
          type="text"
          {...register('username', {
            required: { value: true, message: 'El nombre de usuario es obligatorio' },
          })}
          className="border p-2 w-full mb-4 text-gray-800"
          placeholder="Nombre de usuario"
        />
        {errors.username && <span className="text-red-500 text-xs">{errors.username.message}</span>}

        <label htmlFor="lastname" className="text-slate-500 mb-2 block text-sm">
          Apellido:
        </label>
        <input
          type="text"
          {...register('lastname', {
            required: { value: true, message: 'El apellido es obligatorio' },
          })}
          className="border p-2 w-full mb-4 text-gray-800"
          placeholder="Apellido"
        />
        {errors.lastname && <span className="text-red-500 text-xs">{errors.lastname.message}</span>}

        <label htmlFor="email" className="text-slate-500 mb-2 block text-sm">
          Correo electrónico:
        </label>
        <input
          type="email"
          {...register('email', {
            required: { value: true, message: 'El correo electrónico es obligatorio' },
          })}
          className="border p-2 w-full mb-4 text-gray-800"
          placeholder="Tu correo"
        />
        {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}

        <label htmlFor="password" className="text-slate-500 mb-2 block text-sm">
          Contraseña:
        </label>
        <input
          type="password"
          {...register('password', {
            required: { value: true, message: 'La contraseña es obligatoria' },
          })}
          className="border p-2 w-full mb-4 text-gray-800"
          placeholder="Contraseña"
        />
        {errors.password && <span className="text-red-500 text-xs">{errors.password.message}</span>}

        <label htmlFor="confirmPassword" className="text-slate-500 mb-2 block text-sm">
          Confirmar contraseña:
        </label>
        <input
          type="password"
          {...register('confirmPassword', {
            required: { value: true, message: 'Es obligatorio confirmar la contraseña' },
          })}
          className="border p-2 w-full mb-4 text-gray-800"
          placeholder="Confirmar contraseña"
        />
        {errors.confirmPassword && (
          <span className="text-red-500 text-xs">{errors.confirmPassword.message}</span>
        )}

        <button className="w-full bg-yellow-400 text-black hover:bg-yellow-500 p-2 mb-4">
          Registrar
        </button>
      </form>
    </div>
  );
}

export default RegisterPage;
