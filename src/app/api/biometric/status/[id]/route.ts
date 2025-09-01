// src/app/api/biometric/status/[id]/route.ts
import { NextResponse } from "next/server";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const BASE = process.env.FASTAPI_URL ?? "http://127.0.0.1:8001";

  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 5000); // 5s
    const up = await fetch(`${BASE}/fingerprint/status/${id}`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(t);

    const j = await up.json().catch(() => ({}));
    const ok = up.ok && j?.ok !== false;

    return NextResponse.json(
      ok ? j : { ok: false, hasFingerprint: false, message: j?.message || "Error consultando estado" },
      { status: ok ? 200 : up.status || 502 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, hasFingerprint: false, message: "Servicio biométrico no disponible" },
      { status: 503 }
    );
  }
}
