"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        setError(null);
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
        <h1 className="text-2xl font-bold mb-4">Recuperar Contraseña</h1>
        {message && <p className="text-green-600">{message}</p>}
        {error && <p className="text-red-500">{error}</p>}
        <input
          type="email"
          placeholder="Tu correo electrónico"
          className="border p-2 w-full mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-yellow-400 text-black p-2 w-full rounded hover:bg-yellow-500"
        >
          Enviar Enlace
        </button>
      </form>
    </div>
  );
}
