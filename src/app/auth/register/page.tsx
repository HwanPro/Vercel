"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

type RegisterData = {
  firstname: string;
  username: string;
  lastname: string;
  password: string;
  confirmPassword: string;
  phone: string;
  emergencyPhone?: string;
};

const inputClass =
  "h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400/30";

function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterData>();
  const router = useRouter();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onSubmit = handleSubmit(async (data) => {
    setError("");

    if (data.password !== data.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          firstname: data.firstname,
          username: data.username,
          lastname: data.lastname,
          password: data.password,
          phone: data.phone,
          emergencyPhone: data.emergencyPhone,
        }),
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (response.status === 400 && result.message?.includes("registrado")) {
        setError(result.message);
        return;
      }

      if (response.status === 201) {
        router.push("/auth/login");
        return;
      }

      setError(result.message || "Error en el registro. Inténtalo de nuevo.");
    } catch {
      setError("Error en el registro, por favor inténtalo de nuevo.");
    }
  });

  return (
    <main className="min-h-dvh bg-zinc-100 px-4 py-6 text-zinc-950 sm:grid sm:place-items-center">
      <section className="mx-auto w-full max-w-lg rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-zinc-700 hover:text-yellow-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </button>

        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-wide text-yellow-600">
            Wolf Gym
          </p>
          <h1 className="text-2xl font-black text-zinc-950">Crear cuenta</h1>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Nombre" error={errors.firstname?.message}>
              <input
                type="text"
                placeholder="Nombre"
                {...register("firstname", {
                  required: "El nombre es obligatorio",
                })}
                className={inputClass}
              />
            </Field>

            <Field label="Apellido" error={errors.lastname?.message}>
              <input
                type="text"
                placeholder="Apellido"
                {...register("lastname", {
                  required: "El apellido es obligatorio",
                })}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Usuario" error={errors.username?.message}>
            <input
              type="text"
              placeholder="nombre_usuario"
              {...register("username", { required: "El usuario es obligatorio" })}
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Teléfono" error={errors.phone?.message}>
              <input
                type="tel"
                placeholder="987654321"
                {...register("phone", { required: "Teléfono obligatorio" })}
                className={inputClass}
              />
            </Field>

            <Field label="Emergencia">
              <input
                type="tel"
                placeholder="Opcional"
                {...register("emergencyPhone")}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Contraseña" error={errors.password?.message}>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                {...register("password", { required: "Contraseña obligatoria" })}
                className={`${inputClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute inset-y-0 right-3 grid place-items-center text-zinc-500 hover:text-zinc-900"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </Field>

          <Field
            label="Confirmar contraseña"
            error={errors.confirmPassword?.message}
          >
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirmar contraseña"
                {...register("confirmPassword", {
                  required: "Confirmación obligatoria",
                })}
                className={`${inputClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                className="absolute inset-y-0 right-3 grid place-items-center text-zinc-500 hover:text-zinc-900"
                aria-label={
                  showConfirmPassword
                    ? "Ocultar confirmación"
                    : "Mostrar confirmación"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </Field>

          <button className="h-11 w-full rounded-md bg-yellow-400 text-sm font-bold text-black hover:bg-yellow-300">
            Registrar
          </button>
        </form>
      </section>
    </main>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-zinc-700">
        {label}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export default RegisterPage;
