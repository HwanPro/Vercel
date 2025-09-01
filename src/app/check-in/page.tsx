"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const swalBase = {
  background: "#000",
  color: "#fff",
  confirmButtonColor: "#facc15",
} as const;

function vibrate(ms = 120) {
  try { if (navigator.vibrate) navigator.vibrate(ms); } catch {}
}

export default function CheckInPage() {
  const [loading, setLoading] = useState(false);

  const askPhone = async (title: string): Promise<string | null> => {
    const { value, isConfirmed } = await Swal.fire({
      ...swalBase,
      title,
      input: "tel",
      inputPlaceholder: "987654321",
      inputAttributes: { maxlength: "9", pattern: "\\d{9}" },
      showCancelButton: true,
      confirmButtonText: "Continuar",
      cancelButtonText: "Cancelar",
      preConfirm: (val) => {
        const v = String(val || "").replace(/\D/g, "");
        if (v.length !== 9) {
          Swal.showValidationMessage("Debe tener exactamente 9 dígitos");
          return false as any;
        }
        return v;
      },
    });
    return isConfirmed ? String(value).replace(/\D/g, "").slice(0, 9) : null;
  };

  const identifyOnce = async () => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 20000);

    try {
      const r = await fetch("/api/biometric/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        signal: controller.signal,
        body: JSON.stringify({}),
      });
      const j = await r.json().catch(() => ({}));
      clearTimeout(t);

      if (!r.ok) throw new Error(j?.message || "No se pudo identificar");

      return {
        ok: Boolean(j?.ok ?? true),
        match: Boolean(j?.match),
        userId: j?.userId ?? j?.user_id ?? null,
        name: j?.name ?? undefined,
      };
    } catch (err: any) {
      clearTimeout(t);
      return { ok: false, match: false, userId: null as any };
    }
  };

  const register = async (payload: { userId?: string; phone?: string }) => {
    const r = await fetch("/api/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j?.message || "No se pudo registrar la asistencia");
    return j as { ok: boolean; action: "checkin" | "checkout" | "already_open"; fullName?: string; minutesOpen?: number };
  };

  const startFlow = async () => {
    setLoading(true);

    Swal.fire({
      ...swalBase,
      title: "Identificando...",
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });

    // 3 intentos con huella
    let result: Awaited<ReturnType<typeof identifyOnce>> | null = null;
    for (let i = 1; i <= 3; i++) {
      // pequeño hint visual entre intentos
      result = await identifyOnce();
      if (result.match && result.userId) break;
      if (i < 3) {
        await Swal.update({ title: `No reconocido (${i}/3) · coloca el dedo otra vez` });
      }
    }

    Swal.close();

    try {
      if (result?.match && result.userId) {
        // Registrar por userId
        const data = await register({ userId: result.userId });
        vibrate(200);

        if (data.action === "checkin") {
          await Swal.fire({ ...swalBase, icon: "success", title: `¡Bienvenido${result.name ? ", "+result.name : ""}!`, text: "Entrada registrada." });
        } else if (data.action === "checkout") {
          await Swal.fire({ ...swalBase, icon: "success", title: "¡Hasta la próxima!", text: "Salida registrada." });
        } else {
          await Swal.fire({
            ...swalBase,
            icon: "info",
            title: "Asistencia en curso",
            text: "Vuelve más tarde para marcar tu salida.",
          });
        }
        return;
      }

      // Fallback por teléfono
      const phone = await askPhone("No te reconocimos. Registra por teléfono");
      if (!phone) return;
      const data = await register({ phone });
      vibrate(200);

      if (data.action === "checkin") {
        await Swal.fire({ ...swalBase, icon: "success", title: "¡Bienvenido!", text: "Entrada registrada." });
      } else if (data.action === "checkout") {
        await Swal.fire({ ...swalBase, icon: "success", title: "¡Hasta la próxima!", text: "Salida registrada." });
      } else {
        await Swal.fire({ ...swalBase, icon: "info", title: "Asistencia en curso", text: "Vuelve más tarde para marcar salida." });
      }
    } catch (e: any) {
      vibrate(60);
      await Swal.fire({ ...swalBase, icon: "error", title: "No se pudo registrar la asistencia", text: e?.message || "Inténtalo de nuevo." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6">
      <h2 className="text-2xl font-bold text-yellow-400 mb-4">Registro de Asistencia</h2>
      <p className="text-gray-300 mb-6 text-center">
        Primero probaremos con tu <b>huella</b>. Si falla, podrás usar tu <b>teléfono</b>.
      </p>

      <button
        onClick={startFlow}
        className="bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-500 disabled:opacity-60"
        disabled={loading}
      >
        {loading ? "Leyendo huella..." : "Registrar con Huella"}
      </button>

      <p className="text-gray-400 mt-4 text-sm">
        ¿Problemas con el lector?{" "}
        <span
          className="text-yellow-400 underline cursor-pointer"
          onClick={async () => {
            const p = await askPhone("Registra por teléfono");
            if (!p) return;
            try {
              const data = await register({ phone: p });
              vibrate(200);
              await Swal.fire({ ...swalBase, icon: "success", title: data.action === "checkout" ? "¡Hasta la próxima!" : "¡Bienvenido!", text: data.action === "checkout" ? "Salida registrada." : "Entrada registrada." });
            } catch (e:any) {
              await Swal.fire({ ...swalBase, icon: "error", title: "No se pudo registrar la asistencia", text: e?.message || "Inténtalo de nuevo." });
            }
          }}
        >
          usar teléfono
        </span>
      </p>
    </div>
  );
}
