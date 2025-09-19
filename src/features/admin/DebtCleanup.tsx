// src/features/admin/DebtCleanup.tsx
"use client";

import { useState } from "react";
import { Button } from "@/ui/button";
import Swal from "sweetalert2";

export default function DebtCleanup() {
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const executeCleanup = async (type: 'daily' | 'weekly' | 'both') => {
    const confirmMessages = {
      daily: "¿Limpiar todas las deudas diarias? Esta acción moverá las deudas al historial.",
      weekly: "¿Eliminar el historial de deudas de más de una semana? Esta acción es irreversible.",
      both: "¿Ejecutar limpieza completa? Esto limpiará deudas diarias y historial semanal.",
    };

    const result = await Swal.fire({
      title: "Confirmar limpieza",
      text: confirmMessages[type],
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, limpiar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
    });

    if (!result.isConfirmed) return;

    setLoading(prev => ({ ...prev, [type]: true }));

    try {
      const response = await fetch("/api/admin/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await Swal.fire({
          icon: "success",
          title: "Limpieza completada",
          text: data.message,
          timer: 3000,
          showConfirmButton: false,
        });
      } else {
        throw new Error(data.message || "Error en la limpieza");
      }
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: error instanceof Error ? error.message : "Error desconocido",
      });
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-yellow-400/20">
      <h3 className="text-xl font-bold text-yellow-400 mb-4">
        🧹 Limpieza de Deudas
      </h3>
      
      <div className="space-y-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="font-semibold text-white mb-2">Limpieza Diaria</h4>
          <p className="text-gray-300 text-sm mb-3">
            Mueve todas las deudas diarias al historial. Se ejecuta automáticamente a medianoche.
          </p>
          <Button
            onClick={() => executeCleanup('daily')}
            disabled={loading.daily}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading.daily ? "Limpiando..." : "Limpiar Deudas Diarias"}
          </Button>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="font-semibold text-white mb-2">Limpieza Semanal</h4>
          <p className="text-gray-300 text-sm mb-3">
            Elimina el historial de deudas de más de una semana. Se ejecuta automáticamente los domingos.
          </p>
          <Button
            onClick={() => executeCleanup('weekly')}
            disabled={loading.weekly}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {loading.weekly ? "Limpiando..." : "Limpiar Historial Semanal"}
          </Button>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="font-semibold text-white mb-2">Limpieza Completa</h4>
          <p className="text-gray-300 text-sm mb-3">
            Ejecuta ambas limpiezas: deudas diarias e historial semanal.
          </p>
          <Button
            onClick={() => executeCleanup('both')}
            disabled={loading.both}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading.both ? "Limpiando..." : "Limpieza Completa"}
          </Button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-400/30 rounded-lg">
        <h5 className="font-semibold text-yellow-400 mb-2">ℹ️ Información</h5>
        <ul className="text-sm text-yellow-200 space-y-1">
          <li>• Las deudas diarias se limpian automáticamente cada día a medianoche</li>
          <li>• El historial se limpia automáticamente cada domingo</li>
          <li>• Puedes ejecutar estas limpiezas manualmente cuando sea necesario</li>
          <li>• Las deudas mensuales/plan no se ven afectadas por estas limpiezas</li>
        </ul>
      </div>
    </div>
  );
}
