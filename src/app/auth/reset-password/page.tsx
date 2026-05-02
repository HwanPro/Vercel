"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

export const dynamic = "force-dynamic";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!token) {
      setError("El enlace de recuperación no es válido.");
      return;
    }

    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/set-new-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "No se pudo restablecer la contraseña.");
        return;
      }

      setMessage(data.message || "Contraseña actualizada.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Error restableciendo contraseña:", err);
      setError("Hubo un error, intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-md">
        <button
          type="button"
          onClick={() => router.push("/auth/login")}
          className="mb-4 flex items-center text-gray-700 hover:text-yellow-500"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Volver al login
        </button>

        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
          Nueva contraseña
        </h1>
        <p className="mb-6 text-center text-sm text-gray-600">
          Crea una contraseña segura para recuperar el acceso a tu cuenta.
        </p>

        {message && (
          <div className="mb-4 rounded bg-green-100 p-3 text-sm text-green-700">
            {message}
            <button
              type="button"
              onClick={() => router.push("/auth/login")}
              className="mt-3 block font-semibold underline"
            >
              Iniciar sesión
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="mb-2 block text-sm text-gray-700">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full rounded-lg border p-2 pr-10 text-gray-800"
                autoComplete="new-password"
                minLength={8}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-2 block text-sm text-gray-700">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-lg border p-2 text-gray-800"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !token}
            className="w-full rounded bg-yellow-400 p-2 font-semibold text-black hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Guardando..." : "Restablecer contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
