"use client";

import { useState } from "react";
import Swal from "sweetalert2";

export default function CheckInPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCheckIn = async () => {
    if (!phone) {
      Swal.fire({
        title: "Error",
        text: "Por favor, ingresa tu número de teléfono.",
        icon: "error",
        confirmButtonText: "Aceptar",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      if (!response.ok) {
        throw new Error("Usuario no encontrado o asistencia fallida.");
      }

      Swal.fire({
        title: "Asistencia Registrada",
        text: "Tu ingreso ha sido registrado correctamente.",
        icon: "success",
        confirmButtonText: "Aceptar",
      });
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: "No se pudo registrar la asistencia. Verifica tu número o regístrate en recepción.",
        icon: "error",
        confirmButtonText: "Aceptar",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6">
      <h2 className="text-2xl font-bold text-yellow-400 mb-4">Registro de Asistencia</h2>
      <p className="text-gray-300 mb-4">Ingresa tu número de teléfono para registrar tu asistencia.</p>

      <input
        type="tel"
        className="p-3 border border-yellow-400 rounded-lg text-black w-64 text-center"
        placeholder="Ejemplo: 987654321"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <button
        onClick={handleCheckIn}
        className="mt-4 bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-500"
        disabled={loading}
      >
        {loading ? "Registrando..." : "Registrar Asistencia"}
      </button>
    </div>
  );
}
