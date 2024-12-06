// /app/auth/register/page.tsx

'use client';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type RegisterData = {
  username: string;
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
