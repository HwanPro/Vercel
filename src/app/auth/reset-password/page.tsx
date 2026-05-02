"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import {
  AuthField,
  AuthShell,
  wolfInputClass,
  wolfPrimaryButtonClass,
} from "../auth-shell";

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
    <AuthShell
      compact
      eyebrow="Seguridad"
      title="Nueva clave"
      description="Crea una contraseña segura para recuperar el acceso a tu cuenta."
      backLabel="Volver al login"
      onBack={() => router.push("/auth/login")}
    >
      {message && (
        <div className="mb-4 border border-[#2EBD75]/30 bg-[#2EBD75]/10 p-3 text-sm font-semibold text-[#146C43]">
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
        <div className="mb-4 border border-[#E5484D]/30 bg-[#E5484D]/10 p-3 text-sm font-semibold text-[#B42318]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField label="Nueva contraseña">
          <div className="relative">
            <input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className={`${wolfInputClass} pr-11`}
              autoComplete="new-password"
              minLength={8}
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-3 grid place-items-center text-[#6B6B68] hover:text-[#0A0A0A]"
              onClick={() => setShowPassword((value) => !value)}
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

        <AuthField label="Confirmar contraseña">
          <input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className={wolfInputClass}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </AuthField>

        <button
          type="submit"
          disabled={isLoading || !token}
          className={wolfPrimaryButtonClass}
        >
          {isLoading ? "Guardando..." : "Restablecer contraseña"}
          {!isLoading && <ArrowRight className="h-4 w-4" />}
        </button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
