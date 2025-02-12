"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, ArrowLeft } from "lucide-react"; // Íconos

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
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onSubmit = handleSubmit(async (data) => {
    if (data.password !== data.confirmPassword) {
      return setError("Las contraseñas no coinciden");
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: data.username,
          lastname: data.lastname,
          email: data.email,
          password: data.password,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        router.push("/auth/login?checkEmail=1");
      } else {
        const result = await res.json();
        setError(
          result.message || "Error en el registro, por favor inténtalo de nuevo"
        );
      }
    } catch {
      setError("Error en el registro, por favor inténtalo de nuevo");
    }
  });

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

        <form onSubmit={onSubmit}>
          {error && (
            <p className="bg-red-500 text-white p-3 rounded mb-2">{error}</p>
          )}

          <h1 className="text-black text-2xl font-bold text-center mb-6">
            Registro
          </h1>

          {/* Nombre de usuario */}
          <label
            htmlFor="username"
            className="text-slate-500 mb-2 block text-sm"
          >
            Nombre de usuario:
          </label>
          <input
            type="text"
            {...register("username", {
              required: "El nombre de usuario es obligatorio",
            })}
            className="border p-2 w-full mb-4 text-gray-800"
            placeholder="Nombre de usuario"
          />
          {errors.username && (
            <span className="text-red-500 text-xs">
              {errors.username.message}
            </span>
          )}

          {/* Apellido */}
          <label
            htmlFor="lastname"
            className="text-slate-500 mb-2 block text-sm"
          >
            Apellido:
          </label>
          <input
            type="text"
            {...register("lastname", {
              required: "El apellido es obligatorio",
            })}
            className="border p-2 w-full mb-4 text-gray-800"
            placeholder="Apellido"
          />
          {errors.lastname && (
            <span className="text-red-500 text-xs">
              {errors.lastname.message}
            </span>
          )}

          {/* Correo */}
          <label htmlFor="email" className="text-slate-500 mb-2 block text-sm">
            Correo electrónico:
          </label>
          <input
            type="email"
            {...register("email", {
              required: "El correo electrónico es obligatorio",
              pattern: {
                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                message: "Introduce un correo electrónico válido",
              },
            })}
            className="border p-2 w-full mb-4 text-gray-800"
            placeholder="Tu correo"
          />
          {errors.email && (
            <span className="text-red-500 text-xs">{errors.email.message}</span>
          )}

          {/* Contraseña */}
          <label
            htmlFor="password"
            className="text-slate-500 mb-2 block text-sm"
          >
            Contraseña:
          </label>
          <div className="relative mb-4">
            <input
              type={showPassword ? "text" : "password"}
              {...register("password", {
                required: "La contraseña es obligatoria",
                minLength: {
                  value: 12,
                  message: "La contraseña debe tener al menos 12 caracteres",
                },
                validate: (value) =>
                  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s])[A-Za-z\d\-\_\.]{12,}$/.test(
                    value
                  ) ||
                  "Debe incluir mayúsculas, minúsculas, números y símbolos.",
              })}
              className="border p-2 w-full text-gray-800"
              placeholder="Contraseña"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-500"
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
              {errors.password.message}
            </span>
          )}

          {/* Confirmar contraseña */}
          <label
            htmlFor="confirmPassword"
            className="text-slate-500 mb-2 block text-sm"
          >
            Confirmar contraseña:
          </label>
          <div className="relative mb-4">
            <input
              type={showConfirmPassword ? "text" : "password"}
              {...register("confirmPassword", {
                required: "Es obligatorio confirmar la contraseña",
              })}
              className="border p-2 w-full text-gray-800"
              placeholder="Confirmar contraseña"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-500"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <span className="text-red-500 text-xs">
              {errors.confirmPassword.message}
            </span>
          )}

          {/* Botón de registrar */}
          <button className="w-full bg-yellow-400 text-black hover:bg-yellow-500 p-2 mb-4">
            Registrar
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;
