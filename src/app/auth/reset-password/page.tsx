"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import "react-toastify/dist/ReactToastify.css";

export default function ChangePasswordPage({
  isLoggedIn = false,
  isAdmin = false,
}: {
  isLoggedIn?: boolean;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // Campos del formulario
  const [currentPassword, setCurrentPassword] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Manejo de Redirección en Accesos no Permitidos
  useEffect(() => {
    if (!token && !isLoggedIn && !isAdmin) {
      toast.error("Acceso no permitido.");
      router.push("/");
    }
  }, [token, isLoggedIn, isAdmin, router]);

  // Validación de Campos
  const validatePasswords = () => {
    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.");
      return false;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden.");
      return false;
    }
    return true;
  };

  // 🛠 Función para cambiar contraseña en diferentes casos
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar las contraseñas antes de enviar
    if (!validatePasswords()) return;

    let endpoint = "";
    let bodyData: any = {};

    try {
      if (token) {
        // 🟢 Caso 1: Olvido de contraseña (Recuperación con Token)
        endpoint = "/api/auth/set-new-password";
        bodyData = { token, newPassword };
      } else if (isLoggedIn && !isAdmin) {
        // 🟢 Caso 2: Usuario Logueado Cambia Su Propia Contraseña
        if (!currentPassword) {
          toast.error("Debes ingresar tu contraseña actual.");
          return;
        }
        endpoint = "/api/auth/change-password";
        bodyData = { currentPassword, newPassword };
      } else if (isAdmin) {
        // 🟢 Caso 3: Admin cambia la contraseña de otro usuario
        if (!userEmail) {
          toast.error("Debes ingresar el correo del usuario.");
          return;
        }
        endpoint = "/api/admin/change-user-password";
        bodyData = { email: userEmail, newPassword };
      }

      // Llamada a la API
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Error al cambiar la contraseña");

      // Mostrar éxito y redirigir según el caso
      toast.success(
        token
          ? "✅ Tu contraseña ha sido restablecida correctamente."
          : isAdmin
            ? `✅ Contraseña actualizada para ${userEmail}.`
            : "✅ Tu contraseña ha sido cambiada correctamente."
      );

      setTimeout(() => {
        router.push(
          token ? "/auth/login" : isAdmin ? "/auth/reset-password" : "/dashboard"
        );
      }, 3000);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-4">
          {token
            ? "Restablecer Contraseña"
            : isAdmin
              ? "Cambiar Contraseña (Admin)"
              : "Cambiar Contraseña"}
        </h1>

        {/* Campos para cada caso */}
        {!token && isLoggedIn && !isAdmin && (
          <div>
            <label className="text-sm text-gray-600">Contraseña Actual:</label>
            <Input
              type="password"
              placeholder="Contraseña Actual"
              className="border p-2 w-full mb-4"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
        )}

        {isAdmin && (
          <div>
            <label className="text-sm text-gray-600">Correo del Usuario:</label>
            <Input
              type="email"
              placeholder="Correo del usuario"
              className="border p-2 w-full mb-4"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              required
            />
          </div>
        )}

        {/* Nueva contraseña */}
        <div>
          <label className="text-sm text-gray-600">Nueva Contraseña:</label>
          <Input
            type="password"
            placeholder="Nueva Contraseña"
            className="border p-2 w-full mb-4"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">
            Confirmar Nueva Contraseña:
          </label>
          <Input
            type="password"
            placeholder="Confirmar Nueva Contraseña"
            className="border p-2 w-full mb-4"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <Button
          type="submit"
          className="bg-yellow-400 text-black hover:bg-yellow-500 w-full mt-4"
        >
          {token ? "Restablecer Contraseña" : "Actualizar Contraseña"}
        </Button>
      </form>
    </div>
  );
}
