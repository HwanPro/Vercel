"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/ui/button";
import { toast } from "react-toastify";
import { Mail, Shield, CheckCircle, AlertCircle } from "lucide-react";

export default function SecuritySettingsPage() {
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState<"code" | "link">("code");

  const currentUsername = session?.user?.name || "";
  const isEmailUsername = currentUsername.includes("@");

  const sendVerificationEmail = async () => {
    if (!email || !session?.user?.id) {
      toast.error("Por favor, ingresa un email válido");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          userId: session.user.id,
          type: verificationMethod,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsEmailSent(true);
        toast.success(data.message);
      } else {
        toast.error(data.error || "Error al enviar el email");
      }
    } catch {
      toast.error("Error al enviar el email de verificación");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async () => {
    if (!verificationCode || !session?.user?.id) {
      toast.error("Por favor, ingresa el código de verificación");
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        // Redirect to refresh session
        window.location.href = "/dashboard";
      } else {
        toast.error(data.error || "Código de verificación inválido");
      }
    } catch {
      toast.error("Error al verificar el email");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-6">
            <Shield className="h-6 w-6 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">
              Configuración de Seguridad
            </h1>
          </div>

          {/* Current Status */}
          <div className="mb-8 p-4 rounded-lg border">
            <h2 className="text-lg font-semibold mb-3">Estado Actual</h2>
            <div className="flex items-center">
              {isEmailUsername ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-green-700">
                    Tu cuenta usa email como nombre de usuario: {currentUsername}
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                  <span className="text-yellow-700">
                    Tu cuenta usa nombre de usuario: {currentUsername}
                  </span>
                </>
              )}
            </div>
          </div>

          {!isEmailUsername && (
            <div className="space-y-6">
              {/* Security Recommendation */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Mail className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Recomendación de Seguridad
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        Cambiar tu nombre de usuario por tu email te permitirá:
                      </p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Recuperar tu contraseña fácilmente</li>
                        <li>Recibir notificaciones importantes</li>
                        <li>Verificar tu identidad de forma segura</li>
                        <li>Mejorar la seguridad de tu cuenta</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Verification Method Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Método de Verificación
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="verificationMethod"
                      value="code"
                      checked={verificationMethod === "code"}
                      onChange={(e) => setVerificationMethod(e.target.value as "code")}
                      className="mr-2"
                    />
                    <span>Código de verificación por email</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="verificationMethod"
                      value="link"
                      checked={verificationMethod === "link"}
                      onChange={(e) => setVerificationMethod(e.target.value as "link")}
                      className="mr-2"
                    />
                    <span>Link de verificación por email</span>
                  </label>
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nuevo Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu-email@ejemplo.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isEmailSent}
                />
              </div>

              {/* Send Verification Button */}
              {!isEmailSent && (
                <Button
                  onClick={sendVerificationEmail}
                  disabled={isLoading || !email}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading ? "Enviando..." : `Enviar ${verificationMethod === "code" ? "Código" : "Link"} de Verificación`}
                </Button>
              )}

              {/* Verification Code Input (only for code method) */}
              {isEmailSent && verificationMethod === "code" && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <p className="text-green-800 text-sm">
                      Se ha enviado un código de verificación a {email}. 
                      Revisa tu bandeja de entrada y spam.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Código de Verificación
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="123456"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={6}
                    />
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      onClick={verifyEmail}
                      disabled={isVerifying || !verificationCode}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isVerifying ? "Verificando..." : "Verificar Email"}
                    </Button>
                    <Button
                      onClick={() => {
                        setIsEmailSent(false);
                        setVerificationCode("");
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Cambiar Email
                    </Button>
                  </div>
                </div>
              )}

              {/* Link Method Success Message */}
              {isEmailSent && verificationMethod === "link" && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <p className="text-green-800 text-sm">
                    Se ha enviado un link de verificación a {email}. 
                    Haz clic en el enlace para completar la verificación.
                    Revisa tu bandeja de entrada y spam.
                  </p>
                  <Button
                    onClick={() => {
                      setIsEmailSent(false);
                      setEmail("");
                    }}
                    variant="outline"
                    className="mt-3"
                  >
                    Enviar a otro email
                  </Button>
                </div>
              )}
            </div>
          )}

          {isEmailUsername && (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                ¡Tu cuenta está segura!
              </h2>
              <p className="text-gray-600">
                Ya estás usando tu email como nombre de usuario, lo que proporciona 
                mayor seguridad y facilita la recuperación de contraseña.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
