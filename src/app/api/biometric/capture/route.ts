// src/app/api/biometric/capture/route.ts
import { NextResponse } from "next/server";

const BASE = process.env.BIOMETRIC_BASE || "http://127.0.0.1:8001";
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
    const o = await call("/device/open");
    const jo = await o.json().catch(() => ({}) as any);

    // aceptar "alreadyOpen"
    const opened =
      o.ok && (jo?.ok === true || jo?.alreadyOpen === true || jo?.code === 1);
    if (!opened) {
      return NextResponse.json(
        { ok: false, message: jo?.message || "No se pudo abrir el lector" },
        { status: 400 }
      );
    }

    const c = await call("/device/capture");
    const jc = await c.json().catch(() => ({}) as any);

    // cerrar en background — si falla, no rompe la respuesta
    call("/device/close").catch(() => null);

    const ok = c.ok && jc?.ok && jc?.template;
    return NextResponse.json(
      ok
        ? { ok: true, template: jc.template }
        : { ok: false, message: jc?.message || "No se pudo capturar" },
      { status: ok ? 200 : 400 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, message: "El servicio de captura no respondió" },
      { status: 500 }
    );
  }
}
