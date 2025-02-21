"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyEmail() {
  const [message, setMessage] = useState("Verificando...");
  const [status, setStatus] = useState("loading");
  const [email, setEmail] = useState(""); // Guardar email en caso de reenvío
  const router = useRouter();

  useEffect(() => {
    const verifyEmail = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      const userEmail = params.get("email");

      if (!token) {
        setStatus("error");
        setMessage("Token no proporcionado.");
        return;
      }
      if (userEmail) setEmail(userEmail); // Guardar email

      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage("Correo verificado con éxito. Redirigiendo...");
          setTimeout(() => router.push("/auth/login"), 3000);
        } else {
          setStatus("error");
          setMessage(data.message || "Error al verificar el correo.");
        }
      } catch (error) {
        setStatus("error");
        setMessage("Ocurrió un error inesperado al verificar el correo.");
      }
    };

    verifyEmail();
  }, [router]);

  const resendVerificationEmail = async () => {
    if (!email) return;
    setMessage("Reenviando verificación...");
    setStatus("loading");
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        setStatus("info");
        setMessage(
          "Correo de verificación reenviado. Revisa tu bandeja de entrada."
        );
      } else {
        setStatus("error");
        setMessage(data.message || "No se pudo reenviar el correo.");
      }
    } catch (error) {
      setStatus("error");
      setMessage("Ocurrió un error al reenviar el correo.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">
          Verificación de Correo Electrónico
        </h1>
        <p
          className={`text-lg ${status === "error" ? "text-red-500" : "text-gray-700"}`}
        >
          {message}
        </p>
        {status === "error" && (
          <button
            onClick={resendVerificationEmail}
            className="mt-4 bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500"
          >
            Reenviar correo de verificación
          </button>
        )}
        <button
          onClick={() => router.push("/")}
          className="mt-4 bg-green-400 text-white px-4 py-2 rounded hover:bg-green-500"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}
