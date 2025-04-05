"use client";

import { useState } from "react";
import Swal from "sweetalert2";

export default function CheckInPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCheckIn = async () => {
    // Normalizar el número: eliminar caracteres no numéricos
    const normalizedPhone = phone.replace(/\D/g, "");

    // Validar que el número tenga exactamente 9 dígitos
    if (normalizedPhone.length !== 9) {
      Swal.fire({
        title: "Número inválido",
        text: "Por favor, ingresa un número de teléfono válido de 9 dígitos.",
        icon: "warning",
        confirmButtonText: "Aceptar",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.message.includes("registrado asistencia")) {
          // Mensaje si ya ha registrado asistencia hoy
          Swal.fire({
            title: "Asistencia ya registrada",
            text: "Este número ya ha registrado asistencia hoy.",
            icon: "info",
            confirmButtonText: "Aceptar",
          });
        } else {
          throw new Error(data.message || "Error al registrar asistencia.");
        }
        return;
      }

      Swal.fire({
        title: "Asistencia Registrada",
        text: "Tu ingreso ha sido registrado correctamente.",
        icon: "success",
        confirmButtonText: "Aceptar",
      });

      // Limpiar el input después del registro exitoso
      setPhone("");
    } catch (error) {
      Swal.fire({
        title: "Error",
        text:
          "No se pudo registrar la asistencia. Verifica tu número o regístrate en recepción.",
        icon: "error",
        confirmButtonText: "Aceptar",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6">
      <h2 className="text-2xl font-bold text-yellow-400 mb-4">
        Registro de Asistencia
      </h2>
      <p className="text-gray-300 mb-4">
        Ingresa tu número de teléfono para registrar tu asistencia.
      </p>

      <input
        type="tel"
        className="p-3 border border-yellow-400 rounded-lg text-black w-64 text-center"
        placeholder="Ejemplo: 987654321"
        value={phone}
        onChange={(e) =>
          setPhone(e.target.value.replace(/\D/g, "").slice(0, 9)) // Solo permite 9 dígitos numéricos
        }
        maxLength={9} // Evita que se ingresen más de 9 caracteres
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
