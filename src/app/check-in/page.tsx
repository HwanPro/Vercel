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

function vibrate(ms = 100) {
  try { if (navigator.vibrate) navigator.vibrate(ms); } catch {}
}

type IdentifyResult = { ok: boolean; match: boolean; userId: string | null; name?: string };
type RegisterResult = { ok: boolean; action: "checkin" | "checkout" | "already_open"; fullName?: string; minutesOpen?: number; debt?: number; daysLeft?: number; avatarUrl?: string };

export default function CheckInPage() {
  // ----- modo / sala -----
  const [mode, setMode] = useState<"kiosk" | "remote">("kiosk"); // valor estable para SSR => NO hydration error
  const [room, setRoom] = useState("default");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const sp = new URLSearchParams(window.location.search);
    setMode(sp.get("remote") ? "remote" : "kiosk");
    setRoom(sp.get("room") || "default");
  }, []);

  // ----- estados captura/escaneo -----
  const [loading, setLoading] = useState(false);
  const scanningRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  // ==================== utilidades ====================
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
        name: j?.fullName ?? j?.name,
      };
    } catch {
      clearTimeout(t);
      return { ok: false, match: false, userId: null };
    }
  };

  const register = async (payload: { userId?: string; phone?: string; intent?: "checkout" }) => {
    const r = await fetch("/api/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const j = (await r.json().catch(() => ({}))) as RegisterResult;
    if (!r.ok) throw new Error((j as any)?.message || "No se pudo registrar la asistencia");
    return j;
  };

  // ==================== acciones principal ====================
  const showCard = async (data: RegisterResult, fallbackName?: string) => {
    const name = (data.fullName || fallbackName || "").trim();
  
    // 👇 coerción robusta (si API manda string por Decimal)
    const debtNum =
      data.debt === null || data.debt === undefined ? undefined : Number(data.debt);
    const daysLeftNum =
      data.daysLeft === null || data.daysLeft === undefined ? undefined : Number(data.daysLeft);
  
    const title =
      data.action === "checkout"
        ? `¡Hasta la próxima${name ? ", " + name : ""}!`
        : `¡Bienvenido${name ? ", " + name : ""}!`;
  
    const avatar =
      data.avatarUrl ||
      "https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=" +
        encodeURIComponent(name || "W G");
  
    const html = `
      <div style="display:flex;gap:12px;align-items:center">
        <img src="${avatar}" style="width:64px;height:64px;border-radius:9999px;object-fit:cover" alt="avatar" />
        <div style="text-align:left">
          ${Number.isFinite(daysLeftNum) ? `<div>Días restantes: <b>${daysLeftNum}</b></div>` : ""}
          ${Number.isFinite(debtNum) ? `<div>Deuda: <b>S/. ${debtNum!.toFixed(2)}</b></div>` : ""}
          ${
            data.action === "checkout" && Number.isFinite(data.minutesOpen)
              ? `<div>Sesión: ${data.minutesOpen} min</div>`
              : ""
          }
        </div>
      </div>`;
  
    await Swal.fire({
      ...swalBase,
      icon: "success",
      title,
      html,
      timer: 2000,
      showConfirmButton: false,
    });
  };  

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
      await new Promise(r => setTimeout(r, 900));
    }
    Swal.close();

    try {
      if (matched?.match && matched.userId) {
        const data = await register({ userId: matched.userId });
        vibrate(200);
        await showCard(data, matched.name);
      } else {
        const phone = await askPhone("No te reconocimos. Registra por teléfono");
        if (!phone) return;
        const data = await register({ phone });
        vibrate(200);
        await showCard(data);
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

  const forceCheckout = async () => {
    setLoading(true);
    try {
      await Swal.fire({
        ...swalBase,
        title: "Identificando para registrar salida…",
        allowOutsideClick: true,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
      });
      const res = await identifyOnce();
      Swal.close();

      let data: RegisterResult;
      if (res.match && res.userId) {
        data = await register({ userId: res.userId, intent: "checkout" });
        await showCard(data, res.name);
      } else {
        const p = await askPhone("No te reconocimos. Salida por teléfono");
        if (!p) return;
        data = await register({ phone: p, intent: "checkout" });
        await showCard(data);
      }
      vibrate(200);
    } catch (e: any) {
      await Swal.fire({ ...swalBase, icon: "error", title: "No se pudo registrar la salida", text: e?.message || "Inténtalo de nuevo." });
    } finally {
      setLoading(false);
      abortRef.current?.abort();
    }
  };

  // ==================== kiosko: escucha comandos ====================
  useEffect(() => {
    if (!mounted || mode !== "kiosk") return;
    const ev = new EventSource(`/api/commands?room=${encodeURIComponent(room)}`);
    ev.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data || "{}");
        if (data.action === "scan") startAutoScan();
        if (data.action === "checkout") forceCheckout();
        if (data.action === "stop") {
          scanningRef.current = false;
          abortRef.current?.abort();
          setLoading(false);
          Swal.close();
        }
      } catch {}
    };
    ev.onerror = () => {/* mantener abierta la conexión */};
    return () => ev.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, mode, room]);

  // ==================== remote: envía comandos ====================
  const sendCommand = async (action: "scan" | "checkout" | "stop") => {
    await fetch("/api/commands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room, action }),
    }).catch(() => {});
  };

  // ==================== UI ====================
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 gap-4">
      <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-3xl mb-2 gap-4">
        {/* Título fijo para que SSR == CSR (evita hydration error) */}
        <h1 className="text-2xl md:text-3xl font-bold text-yellow-400">
          Kiosko de Asistencia
        </h1>

        <Link href="/admin/dashboard" className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500 w-full md:w-auto text-center">
          Volver al Dashboard
        </Link>
      </div>

      {/* Chip de modo */}
      <div className="text-sm opacity-80">
        Modo: <span className="px-2 py-0.5 rounded bg-yellow-400 text-black">{mode === "remote" ? "Control remoto" : "Kiosko"}</span> · Sala: <b>{room}</b>
      </div>

      {mode === "kiosk" ? (
        <>
          <p className="text-gray-300 text-center max-w-2xl">
            Reconocimiento <b>automático por huella</b>. Si no te reconoce, usaremos tu <b>teléfono</b>.
          </p>

          {/* Botón visible de salida explícita */}
          <button
            onClick={forceCheckout}
            className="bg-transparent border border-yellow-400 text-yellow-400 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-500 hover:text-black disabled:opacity-60"
            disabled={loading}
          >
            Registrar salida
          </button>
        </>
      ) : (
        // ====== Panel de control remoto ======
        <div className="w-full max-w-md grid grid-cols-1 gap-3 mt-2">
          <button
            onClick={() => sendCommand("scan")}
            className="bg-yellow-400 text-black px-6 py-4 rounded-lg font-bold text-lg hover:bg-yellow-500"
          >
            🔎 Escanear / Marcar entrada
          </button>
          <button
            onClick={() => sendCommand("checkout")}
            className="bg-yellow-400 text-black px-6 py-4 rounded-lg font-bold text-lg hover:bg-yellow-500"
          >
            ⏏️ Marcar salida
          </button>
          <button
            onClick={() => sendCommand("stop")}
            className="bg-black border border-yellow-500 text-yellow-400 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-600/30"
          >
            ✋ Detener
          </button>

          <p className="text-gray-400 text-xs mt-1">
            Abre <code>/check-in?room=nombre</code> en la PC/monitor (kiosko) y <code>/check-in?remote=1&room=nombre</code> en el celular (control).
          </p>
        </div>
      )}
    </div>
  );
}
