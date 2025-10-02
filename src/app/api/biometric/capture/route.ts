// src/app/api/biometric/capture/route.ts
import { NextResponse } from "next/server";

// Forzar base del servicio C# (captura). No usar BIOMETRIC_BASE para evitar colisiones con Python.
const BASE = process.env.BIOMETRIC_CAPTURE_BASE || "http://127.0.0.1:8002";
export const dynamic = "force-dynamic";

async function call(path: string, body?: Record<string, unknown>) {
  return fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
}

export async function POST() {
  try {
    console.log(`[CAPTURE] Iniciando captura, BASE: ${BASE}`);
    
    // Intentar abrir hasta 2 veces por si el dispositivo tarda
    let opened = false;
    let jo: { ok?: boolean; alreadyOpen?: boolean; code?: number; message?: string } = {};
    for (let i = 0; i < 2 && !opened; i++) {
      console.log(`[CAPTURE] Intento ${i + 1} de apertura del dispositivo`);
      const o = await call("/device/open");
      jo = (await o.json().catch(() => ({}))) as {
        ok?: boolean;
        alreadyOpen?: boolean;
        code?: number;
        message?: string;
      };
      opened = o.ok && (jo?.ok === true || jo?.alreadyOpen === true || jo?.code === 1);
      console.log(`[CAPTURE] Resultado apertura: opened=${opened}, response=${JSON.stringify(jo)}`);
      if (!opened) await new Promise((r) => setTimeout(r, 200));
    }
    if (!opened) {
      console.log(`[CAPTURE] Error: No se pudo abrir el dispositivo`);
      return NextResponse.json({ ok: false, message: jo?.message || "No se pudo abrir el lector" }, { status: 400 });
    }

    console.log(`[CAPTURE] Dispositivo abierto, iniciando captura...`);
    const c = await call("/capture");
    const jc = (await c.json().catch(() => ({}))) as { ok?: boolean; template?: string; message?: string };
    console.log(`[CAPTURE] Resultado captura: ${JSON.stringify(jc)}`);

    // cerrar en background — si falla, no rompe la respuesta
    call("/device/close").catch(() => null);

    const ok = c.ok && jc?.ok && jc?.template;
    return NextResponse.json(
      ok
        ? { ok: true, template: jc.template }
        : { ok: false, message: jc?.message || "No se pudo capturar" },
      { status: ok ? 200 : 400 }
    );
  } catch (error) {
    console.error(`[CAPTURE] Error en captura:`, error);
    return NextResponse.json(
      { ok: false, message: "El servicio de captura no respondió" },
      { status: 500 }
    );
  }
}
