"use client";

import { useState, useEffect } from "react";
import { Button } from "@/ui/button";
import { X, Shield, Mail } from "lucide-react";

interface SecurityMessageProps {
  userId: string;
  currentUsername: string;
  onDismiss?: () => void;
}

export default function SecurityMessage({ 
  userId, 
  currentUsername, 
  onDismiss 
}: SecurityMessageProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed this message
    const dismissed = localStorage.getItem(`security-message-dismissed-${userId}`);
    if (!dismissed && !currentUsername.includes('@')) {
      setIsVisible(true);
    }
  }, [userId, currentUsername]);

  const handleDismiss = () => {
    localStorage.setItem(`security-message-dismissed-${userId}`, 'true');
    setIsVisible(false);
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleUpgradeToEmail = () => {
    // Redirect to profile settings or open email change dialog
    window.location.href = '/profile/security';
  };

  if (!isVisible || isDismissed) return null;

  return (
    <div className="fixed top-4 right-4 max-w-md bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Shield className="h-5 w-5 text-blue-500" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-blue-800">
            Mejora la Seguridad de tu Cuenta
          </h3>
          <div className="mt-2 text-sm text-blue-700">
            <p>
              Para mayor seguridad, te recomendamos cambiar tu nombre de usuario 
              por tu dirección de correo electrónico. Esto te permitirá:
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>Recuperar tu contraseña fácilmente</li>
              <li>Recibir notificaciones importantes</li>
              <li>Verificar tu identidad de forma segura</li>
            </ul>
          </div>
          <div className="mt-4 flex space-x-2">
            <Button
              onClick={handleUpgradeToEmail}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1"
            >
              <Mail className="h-3 w-3 mr-1" />
              Cambiar a Email
            </Button>
            <Button
              onClick={handleDismiss}
              variant="outline"
              className="text-xs px-3 py-1"
            >
              Más tarde
            </Button>
          </div>
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={handleDismiss}
            className="inline-flex text-blue-400 hover:text-blue-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
