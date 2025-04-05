"use client";
export const dynamic = "force-dynamic"; // Forzar renderizado dinámico para evitar errores de prerendering

import { useForm, SubmitHandler } from "react-hook-form";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useSession } from "next-auth/react";
import "react-toastify/dist/ReactToastify.css";

type FormData = {
  username: string;
  password: string;
};

export default function AuthPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const [usernameError, setUsernameError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      if ((session?.user as { role?: string })?.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/client/dashboard");
      }
    }
  }, [session, status, router]);

  const handleLogin: SubmitHandler<FormData> = async (data) => {
    setUsernameError(false);
    setPasswordError(false);
    setError(null);

    const res = await signIn("credentials", {
      redirect: false,
      username: data.username,
      password: data.password,
      callbackUrl: "/client/dashboard", // Por defecto
    });

    if (res?.error) {
      setError(res.error);

      if (res.error.toLowerCase().includes("contraseña")) {
        setPasswordError(true);
      }
      if (res.error.toLowerCase().includes("usuario")) {
        setUsernameError(true);
      }

      setFailedAttempts((prev) => prev + 1);
    } else {
      router.push(res?.url || "/client/dashboard");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <button
          onClick={() => router.push("/")}
          className="flex items-center text-gray-700 hover:text-yellow-500 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Volver al inicio
        </button>

        <form onSubmit={handleSubmit(handleLogin)}>
          {error && (
            <p className="bg-red-500 text-white p-3 rounded mb-4">{error}</p>
          )}

          {failedAttempts >= 3 && (
            <p className="text-red-600 text-center mb-4">
              ¿Has olvidado tu contraseña?{" "}
              <button
                type="button"
                onClick={() => router.push("/auth/forgot-password")}
                className="text-yellow-500 underline"
              >
                Recupérala aquí
              </button>
            </p>
          )}

          <h2 className="text-black text-2xl font-bold text-center mb-6">
            Inicia sesión
          </h2>

          <label
            htmlFor="username"
            className="text-slate-500 mb-2 block text-sm"
          >
            Usuario:
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            {...register("username", {
              required: { value: true, message: "El usuario es obligatorio" },
            })}
            className={`border rounded-lg p-2 w-full mb-4 text-gray-800 ${
              usernameError ? "border-red-500" : ""
            }`}
            placeholder="Tu usuario"
          />
          {errors.username && (
            <span className="text-red-500 text-xs mb-2 block">
              {errors.username.message}
            </span>
          )}

          <label
            htmlFor="password"
            className="text-slate-500 mb-2 block text-sm"
          >
            Contraseña:
          </label>
          <div className="relative mb-4">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              {...register("password", {
                required: { value: true, message: "Contraseña obligatoria" },
              })}
              className={`border rounded-lg p-2 w-full text-gray-800 ${
                passwordError ? "border-red-500" : ""
              }`}
              placeholder="*********"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-3 flex items-center text-gray-500"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
          {errors.password && (
            <span className="text-red-500 text-xs mb-4 block">
              {errors.password.message}
            </span>
          )}

          <button
            type="submit"
            className="w-full bg-yellow-400 text-black hover:bg-yellow-500 p-2 mb-6"
          >
            Iniciar sesión
          </button>

          <div className="text-center mb-2">
            <button
              onClick={() => router.push("/auth/register")}
              className="text-black"
              type="button"
            >
              ¿No tienes cuenta?{" "}
              <span className="text-yellow-500">Regístrate</span>
            </button>
          </div>
          <div className="text-center">
            <button
              onClick={() => router.push("/auth/forgot-password")}
              className="text-black"
              type="button"
            >
              ¿Olvidaste tu contraseña?{" "}
              <span className="text-yellow-500">Recupérala aquí</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
