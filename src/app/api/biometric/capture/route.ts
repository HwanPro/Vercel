// src/app/api/biometric/capture/route.ts
import { NextResponse } from "next/server";
const BASE = process.env.FASTAPI_URL || "http://127.0.0.1:8001";

export async function POST() {
  const call = async (path: string, body?: Record<string, unknown>) =>
    fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });

  try {
    const o = await call("/device/open");
    const jo = await o.json().catch(() => ({}));
    const opened = o.ok && jo?.ok === true;
    if (!opened) {
      // ACEPTAR el caso "alreadyOpen"
      const already = (jo && jo.code === 1) || jo?.alreadyOpen;
      if (!already) {
        return NextResponse.json(
          { ok: false, message: jo?.message || "No se pudo abrir el lector" },
          { status: 400 }
        );
      }
    }
    if (!o.ok || !jo?.ok) {
      return NextResponse.json(
        { ok: false, message: jo?.message || "No se pudo abrir el lector" },
        { status: 400 }
      );
    }

    const c = await call("/device/capture");
    const jc = await c.json().catch(() => ({}));
    await call("/device/close").catch(() => null);

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
