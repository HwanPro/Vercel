"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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

type IdentifyResult = {
  ok: boolean;
  match: boolean;
  userId: string | null;
  name?: string;
};

type RegisterResult = {
  ok: boolean;
  action: "checkin" | "checkout" | "already_open";
  fullName?: string;
  minutesOpen?: number;
};

export default function CheckInPage() {
  const [loading, setLoading] = useState(false);
  const scanningRef = useRef(false);   // evita loops dobles
  const abortRef = useRef<AbortController | null>(null);

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

  const identifyOnce = async (): Promise<IdentifyResult> => {
    const controller = new AbortController();
    abortRef.current = controller;
    const t = setTimeout(() => controller.abort(), 15000);
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
      return {
        ok: r.ok,
        match: Boolean(j?.match),
        userId: j?.userId ?? j?.user_id ?? null,
        name: j?.fullName ?? j?.name, // Buscar fullName primero
      };
    } catch {
      clearTimeout(t);
      return { ok: false, match: false, userId: null };
    }
  };

  const registerAttendance = async (userId: string): Promise<RegisterResult> => {
    try {
      const r = await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
        cache: "no-store",
      });
      const j = await r.json().catch(() => ({}));
      
      return {
        ok: r.ok,
        action: j?.type || "checkin",
        fullName: j?.fullName || j?.name,
        minutesOpen: j?.record?.durationMins,
      };
    } catch {
      return { ok: false, action: "checkin" };
    }
  };

  const startScanning = async () => {
    if (scanningRef.current) return;
    scanningRef.current = true;
    setLoading(true);

    try {
      while (scanningRef.current) {
        const result = await identifyOnce();
        
        if (result.match && result.userId) {
          // Match encontrado - registrar asistencia
          const attendance = await registerAttendance(result.userId);
          
          if (attendance.ok) {
            const greeting = attendance.fullName 
              ? `¡Hola ${attendance.fullName}!`
              : "¡Bienvenido!";
            
            const actionText = attendance.action === "checkout" 
              ? `Salida registrada (${attendance.minutesOpen} min)`
              : "Entrada registrada";
            
            await Swal.fire({
              ...swalBase,
              title: greeting,
              text: actionText,
              icon: "success",
              timer: 2000,
              showConfirmButton: false,
            });
          } else {
            await Swal.fire({
              ...swalBase,
              title: "Error",
              text: "No se pudo registrar la asistencia",
              icon: "error",
              timer: 2000,
              showConfirmButton: false,
            });
          }
          
          // Pausa después del registro
          await new Promise(resolve => setTimeout(resolve, 3000));
        } else {
          // No match - continuar loop
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } finally {
      setLoading(false);
      scanningRef.current = false;
    }
  };

  const register = async (payload: { userId?: string; phone?: string; intent?: "checkout" }) => {
    const r = await fetch("/api/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = (await r.json().catch(() => ({}))) as RegisterResult;
    if (!r.ok) throw new Error((j as any)?.message || "No se pudo registrar la asistencia");
    return j;
  };

  // Bucle de escaneo automático: intenta hasta reconocer, sin botón
  const startAutoScan = async () => {
    if (scanningRef.current) return;
    scanningRef.current = true;
    setLoading(true);

    await Swal.fire({
      ...swalBase,
      title: "Coloca tu dedo en el lector",
      html: `<div style="opacity:.85">Escuchando huella…</div>`,
      allowOutsideClick: true,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });

    let matched: IdentifyResult | null = null;

    while (scanningRef.current) {
      const res = await identifyOnce();
      if (res.match && res.userId) { matched = res; break; }
      // pequeño respiro para no saturar
      await new Promise(r => setTimeout(r, 900));
    }

    Swal.close();

    try {
      if (matched?.match && matched.userId) {
        const data = await register({ userId: matched.userId });
        vibrate(200);
        const name = (data.fullName || matched.name || "").trim();
        if (data.action === "checkin") {
          await Swal.fire({ ...swalBase, icon: "success", title: `¡Bienvenido${name ? ", "+name : ""}!`, text: "Entrada registrada." });
        } else if (data.action === "checkout") {
          await Swal.fire({ ...swalBase, icon: "success", title: `¡Hasta la próxima${name ? ", "+name : ""}!`, text: "Salida registrada." });
        } else {
          await Swal.fire({ ...swalBase, icon: "info", title: `Asistencia en curso${name ? " de " + name : ""}`, text: "Vuelve más tarde para marcar tu salida." });
        }
      } else {
        // Fallback por teléfono si no hubo match
        const phone = await askPhone("No te reconocimos. Registra por teléfono");
        if (!phone) return;
        const data = await register({ phone });
        vibrate(200);
        await Swal.fire({
          ...swalBase,
          icon: "success",
          title: data.action === "checkout" ? "¡Hasta la próxima!" : "¡Bienvenido!",
          text: data.action === "checkout" ? "Salida registrada." : "Entrada registrada.",
        });
      }
    } catch (e: any) {
      vibrate(60);
      await Swal.fire({ ...swalBase, icon: "error", title: "No se pudo registrar la asistencia", text: e?.message || "Inténtalo de nuevo." });
    } finally {
      setLoading(false);
      scanningRef.current = false;
      abortRef.current?.abort();
    }
  };

  // Botón de salida explícito (no depende del toggle)
  const forceCheckout = async () => {
    setLoading(true);
    try {
      const modal = await Swal.fire({
        ...swalBase,
        title: "Identificando para registrar salida…",
        allowOutsideClick: true,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await identifyOnce();
      Swal.close();

      if (!(res.match && res.userId)) {
        const p = await askPhone("No te reconocimos. Salida por teléfono");
        if (!p) return;
        const data = await register({ phone: p, intent: "checkout" });
        vibrate(200);
        await Swal.fire({ ...swalBase, icon: "success", title: "¡Hasta la próxima!", text: "Salida registrada." });
        return;
      }

      const data = await register({ userId: res.userId, intent: "checkout" });
      vibrate(200);
      const name = (data.fullName || res.name || "").trim();
      await Swal.fire({ ...swalBase, icon: "success", title: `¡Hasta la próxima${name ? ", "+name : ""}!`, text: "Salida registrada." });
    } catch (e: any) {
      await Swal.fire({ ...swalBase, icon: "error", title: "No se pudo registrar la salida", text: e?.message || "Inténtalo de nuevo." });
    } finally {
      setLoading(false);
      abortRef.current?.abort();
    }
  };

  // Arranca el autoescaneo al montar (sin botón)
  useEffect(() => {
    startAutoScan();
    return () => {
      scanningRef.current = false;
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 gap-4">
      <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-3xl mb-2 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-yellow-400">Registro de Asistencia</h1>
        <Link href="/admin/dashboard" className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500 w-full md:w-auto text-center">
          Volver al Dashboard
        </Link>
      </div>

      <p className="text-gray-300 text-center max-w-2xl">
        Reconocimiento <b>automático por huella</b>. Si no te reconoce, podrás usar tu <b>teléfono</b>.
      </p>

      {/* Botón oculto: respaldo manual si algo falla */}
      <button
        onClick={startAutoScan}
        className="bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-500 disabled:opacity-60 hidden"
        disabled={loading}
        aria-hidden
      >
        Reintentar huella
      </button>

      {/* Botón visible de salida explícita */}
      <button
        onClick={forceCheckout}
        className="bg-transparent border border-yellow-400 text-yellow-400 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-500 hover:text-black disabled:opacity-60"
        disabled={loading}
      >
        Registrar salida
      </button>

      <p className="text-gray-500 text-xs mt-2">
        Consejo: mantén el dedo firme ~1s. Si no responde, toca “Registrar salida” o usa teléfono desde el aviso.
      </p>
    </div>
  );
}
