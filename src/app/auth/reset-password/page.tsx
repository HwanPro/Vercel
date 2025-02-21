"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError("Token inválido");
      return;
    }

    try {
      const res = await fetch("/api/auth/set-new-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        setError(null);
        setTimeout(() => router.push("/auth/login"), 3000);
      } else {
        setError(data.message);
        setMessage(null);
      }
    } catch (err) {
      setError("Hubo un error, intenta nuevamente.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-4">Nueva Contraseña</h1>
        {message && <p className="text-green-600">{message}</p>}
        {error && <p className="text-red-500">{error}</p>}
        <input
          type="password"
          placeholder="Nueva Contraseña"
          className="border p-2 w-full mb-4"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-yellow-400 text-black p-2 w-full rounded hover:bg-yellow-500"
        >
          Cambiar Contraseña
        </button>
      </form>
    </div>
  );
}
