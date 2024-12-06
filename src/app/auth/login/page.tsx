// /app/auth/login/page.tsx

'use client';
import { useForm, SubmitHandler } from 'react-hook-form';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';

type FormData = {
  email: string;
  password: string;
};

export default function AuthPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  // Inicializar useForm con tipado de FormData
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  // Función para manejar el inicio de sesión
  const handleLogin: SubmitHandler<FormData> = async (data) => {
    const res = await signIn('credentials', {
      redirect: false,
      email: data.email,
      password: data.password,
      callbackUrl: '/client/dashboard', // Redirigir al dashboard del cliente
    });

    if (res?.error) {
      setError(res.error);
    } else {
      router.push(res?.url || '/client/dashboard');
    }
  };

  // Función para manejar el inicio de sesión con Google
  const handleGoogleLogin = () => {
    signIn('google', { callbackUrl: '/client/dashboard' }).catch(() =>
      setError('Error al iniciar sesión con Google')
    );
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit(handleLogin)}
        className="bg-white p-6 rounded shadow-md w-full max-w-md"
      >
        {error && (
          <p className="bg-red-500 text-white p-3 rounded mb-2">{error}</p>
        )}

        <h2 className="text-black text-2xl font-bold text-center mb-6">
          Te damos la bienvenida de nuevo
        </h2>

        <label
          htmlFor="email"
          className="text-slate-500 mb-2 block text-sm"
        >
          Email:
        </label>
        <input
          type="email"
          {...register('email', {
            required: { value: true, message: 'Email es obligatorio' },
          })}
          className="border p-2 w-full mb-4 text-gray-800"
          placeholder="user@email.com"
        />
        {errors.email && (
          <span className="text-red-500 text-xs">
            {errors.email.message as string}
          </span>
        )}

        <label
          htmlFor="password"
          className="text-slate-500 mb-2 block text-sm"
        >
          Contraseña:
        </label>
        <input
          type="password"
          {...register('password', {
            required: { value: true, message: 'Contraseña es obligatoria' },
          })}
          className="border p-2 w-full mb-4 text-gray-800"
          placeholder="******"
        />
        {errors.password && (
          <span className="text-red-500 text-xs">
            {errors.password.message as string}
          </span>
        )}

        <button className="w-full bg-yellow-400 text-black hover:bg-yellow-500 p-2 mb-4">
          Iniciar sesión
        </button>

        <div className="text-center mb-4">
          <a
            href="#"
            className="text-black"
            onClick={() => router.push('/auth/register')}
          >
            ¿No tienes cuenta?{' '}
            <span className="text-yellow-500">Regístrate</span>
          </a>
        </div>

        <div className="flex items-center justify-center my-4">
          <hr className="w-1/5" />
          <span className="mx-2 text-gray-500">o</span>
          <hr className="w-1/5" />
        </div>

        <button
          type="button"
          className="w-full bg-white border border-gray-300 text-black p-2 flex justify-center items-center"
          onClick={handleGoogleLogin}
        >
          <Image
            src="https://cdn-icons-png.flaticon.com/512/2991/2991148.png"
            alt="Google icon"
            width={50}
            height={50}
            className="w-5 h-5 mr-2"
          />
          Continuar con Google
        </button>
      </form>
    </div>
  );
}
