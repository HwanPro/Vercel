"use client";

import { useState } from "react";
import Swal from "sweetalert2";

export default function CheckInPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCheckIn = async () => {
    const normalizedPhone = phone.replace(/\D/g, "");

    if (normalizedPhone.length !== 9) {
      return Swal.fire({
        title: "Número inválido",
        text: "Debe tener exactamente 9 dígitos.",
        icon: "warning",
        confirmButtonText: "Aceptar",
      });
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
        if (data.reason === "already_checked_in") {
          localStorage.setItem("checkedIn", normalizedPhone);

          return Swal.fire({
            title: "Entrada ya registrada",
            text: "¿Deseas marcar tu salida ahora?",
            icon: "info",
            showCancelButton: true,
            confirmButtonText: "Marcar salida",
            cancelButtonText: "Cancelar",
            preConfirm: async () => {
              const outResp = await fetch("/api/check-in", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: normalizedPhone }),
              });
              const outData = await outResp.json();
              if (!outResp.ok)
                throw new Error(outData.message || "Error al registrar salida");

              localStorage.removeItem("checkedIn");

              Swal.fire("Salida registrada", "Gracias por tu visita.", "success");
            },
          });
        }

        if (data.reason === "not_found") {
          return Swal.fire({
            title: "Número no registrado",
            text: "Tu número no está registrado. Solicita ayuda en recepción.",
            icon: "error",
            confirmButtonText: "Aceptar",
          });
        }

        throw new Error(data.message || "Error desconocido.");
      }

      localStorage.setItem("checkedIn", normalizedPhone);
      Swal.fire("Asistencia registrada", "¡Bienvenido!", "success");
      setPhone("");
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: "Hubo un problema al registrar tu asistencia.",
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
          setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))
        }
        maxLength={9}
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
