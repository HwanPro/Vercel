"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // Asegúrate de importar desde "next/navigation" si usas Next 13

const VerifyEmail = () => {
  const [message, setMessage] = useState<string>("Verificando...");
  const router = useRouter();

  useEffect(() => {
    const verifyEmail = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (!token) {
        setMessage("Token no proporcionado.");
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setMessage("Correo verificado exitosamente.");
        } else {
          setMessage(data.message);
        }
      } catch (error) {
        setMessage("Error al verificar el correo.");
      }
    };

    verifyEmail();
  }, []);

  return (
    <div>
      <h1>Verificación de Correo Electrónico</h1>
      <p>{message}</p>
    </div>
  );
};

export default VerifyEmail;
