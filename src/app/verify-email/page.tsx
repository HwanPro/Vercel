"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const VerifyEmail = () => {
  const [message, setMessage] = useState<string>("Verificando...");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const router = useRouter();

  useEffect(() => {
    const verifyEmail = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (!token) {
        setStatus("error");
        setMessage("Token no proporcionado.");
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();
        if (response.ok) {
          setStatus("success");
          setMessage("Correo verificado exitosamente. Redirigiendo...");
          setTimeout(() => {
            router.push("/auth/login");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(data.message || "Error al verificar el correo.");
        }
      } catch (error) {
        setStatus("error");
        setMessage("Error al verificar el correo.");
      }
    };

    verifyEmail();
  }, []);

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
            <p className="mt-4 text-blue-600">{message}</p>
          </div>
        );
      case "success":
        return (
          <div className="flex flex-col items-center">
            <svg
              className="w-16 h-16 text-green-500"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m-7 4a9 9 0 1018 0 9 9 0 00-18 0z"
              />
            </svg>
            <p className="mt-4 text-green-600">{message}</p>
          </div>
        );
      case "error":
        return (
          <div className="flex flex-col items-center">
            <svg
              className="w-16 h-16 text-red-500"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4m0 4h.01M12 2a10 10 0 110 20 10 10 0 010-20z"
              />
            </svg>
            <p className="mt-4 text-red-600">{message}</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Verificación de Correo Electrónico</h1>
        {renderContent()}
      </div>
    </div>
  );
};

export default VerifyEmail;
