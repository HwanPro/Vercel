"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

type RegisterData = {
  firstname: string;
  username: string;
  lastname: string;
  password: string;
  confirmPassword: string;
  phone: string;
  emergencyPhone?: string;
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
      setError("Las contraseñas no coinciden");
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          firstname: data.firstname,
          username: data.username,
          lastname: data.lastname,
          password: data.password,
          phone: data.phone,
          emergencyPhone: data.emergencyPhone,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await res.json();

      if (res.status === 400 && result.message.includes("registrado")) {
        setError(result.message);
        return;
      }

      if (res.status === 201) {
        // Registro exitoso
        router.push("/auth/login");
        return;
      }

      setError(result.message || "Error en el registro. Inténtalo de nuevo.");
    } catch {
      setError("Error en el registro, por favor inténtalo de nuevo.");
    }
  });

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md border border-gray-200">
        <button
          onClick={() => router.push("/")}
          className="flex items-center text-gray-700 hover:text-yellow-500 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Volver al inicio
        </button>

        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <p className="bg-red-500 text-white p-3 rounded">{error}</p>
          )}

          <h1 className="text-black text-2xl font-bold text-center mb-4">
            Registro
          </h1>

          <input
            type="text"
            placeholder="Nombre"
            {...register("firstname", {
              required: "El usuario es obligatorio",
            })}
            className="border rounded-lg p-2 w-full"
          />
          {errors.firstname && (
            <p className="text-red-500 text-xs">{errors.firstname.message}</p>
          )}

          <input
            type="text"
            placeholder="Nombre de usuario"
            {...register("username", { required: "El usuario es obligatorio" })}
            className="border rounded-lg p-2 w-full"
          />
          {errors.username && (
            <p className="text-red-500 text-xs">{errors.username.message}</p>
          )}

          <input
            type="text"
            placeholder="Apellido"
            {...register("lastname", {
              required: "El apellido es obligatorio",
            })}
            className="border rounded-lg p-2 w-full"
          />
          {errors.lastname && (
            <p className="text-red-500 text-xs">{errors.lastname.message}</p>
          )}

          <input
            type="text"
            placeholder="Teléfono"
            {...register("phone", { required: "Teléfono obligatorio" })}
            className="border rounded-lg p-2 w-full"
          />

          <input
            type="text"
            placeholder="Teléfono de emergencia (opcional)"
            {...register("emergencyPhone")}
            className="border rounded-lg p-2 w-full"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              {...register("password", { required: "Contraseña obligatoria" })}
              className="border rounded-lg p-2 w-full"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center"
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>

          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirmar contraseña"
              {...register("confirmPassword", {
                required: "Confirmación obligatoria",
              })}
              className="border rounded-lg p-2 w-full"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-3 flex items-center"
            >
              {showConfirmPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>

          <button className="w-full bg-yellow-400 text-black hover:bg-yellow-500 rounded-lg p-2">
            Registrar
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;
