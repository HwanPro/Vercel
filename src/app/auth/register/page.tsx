"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

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
        // Redirigir a login o mostrar un mensaje "Revisa tu correo"
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

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const toggleConfirmPasswordVisibility = () => {
    setConfirmPasswordVisible(!confirmPasswordVisible);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={onSubmit}
        className="bg-white p-6 rounded shadow-md w-full max-w-md"
      >
        {error && (
          <p className="bg-red-500 text-white p-3 rounded mb-2">{error}</p>
        )}

        <h1 className="text-black text-2xl font-bold text-center mb-6">
          Registro
        </h1>

        <label htmlFor="username" className="text-slate-500 mb-2 block text-sm">
          Nombre de usuario:
        </label>
        <input
          type="text"
          {...register("username", {
            required: {
              value: true,
              message: "El nombre de usuario es obligatorio",
            },
          })}
          className="border p-2 w-full mb-4 text-gray-800"
          placeholder="Nombre de usuario"
        />
        {errors.username && (
          <span className="text-red-500 text-xs">
            {errors.username.message}
          </span>
        )}

        <label htmlFor="lastname" className="text-slate-500 mb-2 block text-sm">
          Apellido:
        </label>
        <input
          type="text"
          {...register("lastname", {
            required: { value: true, message: "El apellido es obligatorio" },
          })}
          className="border p-2 w-full mb-4 text-gray-800"
          placeholder="Apellido"
        />
        {errors.lastname && (
          <span className="text-red-500 text-xs">
            {errors.lastname.message}
          </span>
        )}

        <label htmlFor="email" className="text-slate-500 mb-2 block text-sm">
          Correo electrónico:
        </label>
        <input
          type="email"
          {...register("email", {
            required: {
              value: true,
              message: "El correo electrónico es obligatorio",
            },
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
        {errors.email && (
          <span className="text-red-500 text-xs">{errors.email.message}</span>
        )}

        <label htmlFor="password" className="text-slate-500 mb-2 block text-sm">
          Contraseña:
        </label>
        <div className="relative mb-4">
          <input
            type={passwordVisible ? "text" : "password"}
            {...register("password", {
              required: {
                value: true,
                message: "La contraseña es obligatoria",
              },
              minLength: {
                value: 12,
                message: "La contraseña debe tener al menos 12 caracteres",
              },
              validate: (value) =>
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s])[A-Za-z\d\-\_\.]{12,}$/.test(
                  value
                ) ||
                "La contraseña debe incluir mayúsculas, minúsculas, números y símbolos.",
            })}
            className="border p-2 w-full text-gray-800"
            placeholder="Contraseña"
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-0 px-3 text-gray-600"
          >
            {passwordVisible ? "Ocultar" : "Mostrar"}
          </button>
        </div>
        {errors.password && (
          <span className="text-red-500 text-xs">
            {errors.password.message}
          </span>
        )}

        <label
          htmlFor="confirmPassword"
          className="text-slate-500 mb-2 block text-sm"
        >
          Confirmar contraseña:
        </label>
        <div className="relative mb-4">
          <input
            type={confirmPasswordVisible ? "text" : "password"}
            {...register("confirmPassword", {
              required: {
                value: true,
                message: "Es obligatorio confirmar la contraseña",
              },
            })}
            className="border p-2 w-full text-gray-800"
            placeholder="Confirmar contraseña"
          />
          <button
            type="button"
            onClick={toggleConfirmPasswordVisibility}
            className="absolute inset-y-0 right-0 px-3 text-gray-600"
          >
            {confirmPasswordVisible ? "Ocultar" : "Mostrar"}
          </button>
        </div>
        {errors.confirmPassword && (
          <span className="text-red-500 text-xs">
            {errors.confirmPassword.message}
          </span>
        )}

        <button className="w-full bg-yellow-400 text-black hover:bg-yellow-500 p-2 mb-4">
          Registrar
        </button>
      </form>
    </div>
  );
}

export default RegisterPage;
