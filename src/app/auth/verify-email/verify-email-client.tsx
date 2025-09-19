// app/auth/verify-email/verify-email-client.tsx
"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/ui/button";
import { toast } from "react-toastify";
import { CheckCircle, AlertCircle, Mail } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState("");

  const token = searchParams.get("token");

  const verifyEmailToken = useCallback(async () => {
    if (!token) {
      setError("Falta el token de verificación.");
      return;
    }
    setIsVerifying(true);
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        cache: "no-store",
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setIsVerified(true);
        if (data?.message) toast.success(data.message);
        setTimeout(() => router.push("/dashboard"), 3000);
      } else {
        setError(data?.error || "Error al verificar el email");
      }
    } catch {
      setError("Error al verificar el email");
    } finally {
      setIsVerifying(false);
    }
  }, [token, router]);

  useEffect(() => {
    verifyEmailToken();
  }, [verifyEmailToken]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Mail className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Verificación de Email
          </h2>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {isVerifying && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Verificando tu email...</p>
            </div>
          )}

          {isVerified && !isVerifying && (
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¡Email Verificado!
              </h3>
              <p className="text-gray-600 mb-4">
                Tu email ha sido verificado exitosamente. Tu nombre de usuario ha sido actualizado.
              </p>
              <p className="text-sm text-gray-500">
                Serás redirigido al dashboard en unos segundos...
              </p>
            </div>
          )}

          {!isVerified && !isVerifying && error && (
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Error de Verificación
              </h3>
              <p className="text-red-600 mb-4">{error}</p>
              <Button
                onClick={() => router.push("/profile/security")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Intentar de Nuevo
              </Button>
            </div>
          )}

          {!token && !isVerifying && !isVerified && !error && (
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Token de Verificación Requerido
              </h3>
              <p className="text-gray-600 mb-4">
                No se encontró un token de verificación válido en la URL.
              </p>
              <Button
                onClick={() => router.push("/profile/security")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Ir a Configuración de Seguridad
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando verificación...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
