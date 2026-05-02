"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useSession } from "next-auth/react";
import {
  AuthField,
  AuthShell,
  wolfInputClass,
  wolfPrimaryButtonClass,
} from "../auth-shell";

type FormData = {
  username: string;
  password: string;
};

export default function AuthPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Redirigir si ya hay sesión activa
  useEffect(() => {
    // Si ya hay sesión, decidimos adónde redirigir según rol
    if (status === "authenticated") {
      const role = (session.user as { role?: string })?.role;
      if (role === "admin") router.push("/admin/dashboard");
      else router.push("/client/dashboard");
    }
  }, [session, status, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const handleLogin: SubmitHandler<FormData> = async (data) => {
    setError(null);

    const res = await signIn("credentials", {
      redirect: false,
      username: data.username,
      password: data.password,
      callbackUrl: "/", // Redirecciona para que useSession detecte la sesión
    });

    if (res?.error) {
      setError(res.error);
    } else if (res?.ok) {
      // Esperar a que la sesión esté disponible
      router.refresh(); // Actualiza la ruta actual para cargar la sesión
    }
  };

  return (
    <AuthShell
      compact
      eyebrow="Bienvenido de vuelta"
      title="Inicia sesión"
      description="Entra a tu cuenta para ver tu plan, tus rutinas y tu progreso."
      onBack={() => router.push("/")}
    >
      <form onSubmit={handleSubmit(handleLogin)} className="space-y-5">
        {error && (
          <p className="border border-[#E5484D]/30 bg-[#E5484D]/10 px-3 py-2 text-sm font-semibold text-[#B42318]">
            {error}
          </p>
        )}

        <AuthField label="Usuario" error={errors.username?.message}>
          <input
            id="username"
            type="text"
            autoComplete="username"
            {...register("username", {
              required: { value: true, message: "El usuario es obligatorio" },
            })}
            className={wolfInputClass}
            placeholder="tu_usuario"
          />
        </AuthField>

        <AuthField label="Contraseña" error={errors.password?.message}>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              {...register("password", {
                required: { value: true, message: "Contraseña obligatoria" },
              })}
              className={`${wolfInputClass} pr-11`}
              placeholder="********"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-3 grid place-items-center text-[#6B6B68] hover:text-[#0A0A0A]"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </AuthField>

        <button
          type="button"
          onClick={() => router.push("/auth/forgot-password")}
          className="text-sm font-bold text-[#FF7A1A] hover:text-[#0A0A0A]"
        >
          ¿Olvidaste tu contraseña?
        </button>

        <button type="submit" className={wolfPrimaryButtonClass}>
          Iniciar sesión
          <ArrowRight className="h-4 w-4" />
        </button>

        <div className="text-center text-sm text-[#6B6B68]">
          <button
            onClick={() => router.push("/auth/register")}
            className="font-semibold text-[#0A0A0A] hover:text-[#FF7A1A]"
            type="button"
          >
            ¿No tienes cuenta? Regístrate
          </button>
        </div>
      </form>
    </AuthShell>
  );
}
