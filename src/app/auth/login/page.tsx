"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useSession } from "next-auth/react";
import "react-toastify/dist/ReactToastify.css";

type FormData = {
  email: string;
  password: string;
};

export default function AuthPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [failedAttempts] = useState(0);

  // Si ya hay sesión, redirigir al dashboard correspondiente
  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/client/dashboard");
      }
    }
  }, [session, status, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  // Ejemplo en AuthPage:
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const handleLogin: SubmitHandler<FormData> = async (data) => {
    setEmailError(false);
    setPasswordError(false);
    setError(null);

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

    if (res?.error) {
      // Dependiendo del contenido del error, resalta el input adecuado.
      if (res.error.toLowerCase().includes("contraseña")) {
        setPasswordError(true);
      }
      if (
        res.error.toLowerCase().includes("correo") ||
        res.error.toLowerCase().includes("usuario")
      ) {
        setEmailError(true);
      }
      setError(res.error);
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
            <p className="bg-red-500 text-white p-3 rounded mb-2">{error}</p>
          )}
          {failedAttempts >= 3 && (
            <p className="text-red-600 text-center mb-2">
              ¿Has olvidado tu contraseña? <br />
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
            Te damos la bienvenida de nuevo
          </h2>

          <label htmlFor="email" className="text-slate-500 mb-2 block text-sm">
            Email:
          </label>
          <input
            id="email"
            type="email"
            {...register("email", {
              required: { value: true, message: "Email es obligatorio" },
            })}
            className={`border p-2 w-full mb-4 text-gray-800 ${emailError ? "border-red-500" : ""}`}
            placeholder="tucorreo@email.com"
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
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              {...register("password", {
                required: { value: true, message: "Contraseña es obligatoria" },
              })}
              className={`border p-2 w-full mb-4 text-gray-800 ${passwordError ? "border-red-500" : ""}`}
              placeholder="*********"
              autoComplete="current-password"
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
            <span className="text-red-500 text-xs">
              {errors.password.message as string}
            </span>
          )}

          <button className="w-full bg-yellow-400 text-black hover:bg-yellow-500 p-2 mb-4">
            Iniciar sesión
          </button>

          <div className="text-center">
            <button
              onClick={() => router.push("/auth/register")}
              className="text-black"
              type="button"
            >
              ¿No tienes cuenta?{" "}
              <span className="text-yellow-500">Regístrate</span>
            </button>
          </div>
          <div className="text-center mt-2">
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
