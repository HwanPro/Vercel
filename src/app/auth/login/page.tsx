"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, ArrowLeft } from "lucide-react"; // Íconos para funcionalidad extra
import "react-toastify/dist/ReactToastify.css";

type FormData = {
  email: string;
  password: string;
};

export default function AuthPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Inicializar useForm con tipado de FormData
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  // Función para manejar el inicio de sesión
  const handleLogin: SubmitHandler<FormData> = async (data) => {
    const res = await signIn("credentials", {
      redirect: false,
      email: data.email,
      password: data.password,
      callbackUrl: "/client/dashboard",
    });

    if (res?.error) {
      setError(res.error);
    } else {
      router.push(res?.url || "/client/dashboard");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
        {/* Botón de volver atrás */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center text-black hover:text-yellow-500 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Volver al inicio
        </button>

        <form onSubmit={handleSubmit(handleLogin)}>
          {error && (
            <p className="bg-red-500 text-white p-3 rounded mb-2">{error}</p>
          )}

          <h2 className="text-black text-2xl font-bold text-center mb-6">
            Te damos la bienvenida de nuevo
          </h2>

          {/* Email */}
          <label htmlFor="email" className="text-slate-500 mb-2 block text-sm">
            Email:
          </label>
          <input
            type="email"
            {...register("email", {
              required: { value: true, message: "Email es obligatorio" },
            })}
            className="border p-2 w-full mb-4 text-gray-800"
            placeholder="user@email.com"
          />
          {errors.email && (
            <span className="text-red-500 text-xs">
              {errors.email.message as string}
            </span>
          )}

          {/* Contraseña con opción de mostrar/ocultar */}
          <label
            htmlFor="password"
            className="text-slate-500 mb-2 block text-sm"
          >
            Contraseña:
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              {...register("password", {
                required: {
                  value: true,
                  message: "Contraseña es obligatoria",
                },
              })}
              className="border p-2 w-full mb-4 text-gray-800"
              placeholder="******"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-3 flex items-center text-gray-500"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <span className="text-red-500 text-xs">
              {errors.password.message as string}
            </span>
          )}

          {/* Botón de inicio de sesión */}
          <button className="w-full bg-yellow-400 text-black hover:bg-yellow-500 p-2 mb-4">
            Iniciar sesión
          </button>

          {/* Registro */}
          <div className="text-center">
            <a
              href="#"
              className="text-black"
              onClick={() => router.push("/auth/register")}
            >
              ¿No tienes cuenta?{" "}
              <span className="text-yellow-500">Regístrate</span>
            </a>
          </div>
          {/* Recuperar Contraseña */}
          <div className="text-center mt-2">
            <a
              href="#"
              className="text-black"
              onClick={() => router.push("/auth/forgot-password")}
            >
              ¿Olvidaste tu contraseña?{" "}
              <span className="text-yellow-500">Recupérala aquí</span>
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
