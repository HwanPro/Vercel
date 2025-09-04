// src/app/api/biometric/status/[id]/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const BASE = process.env.BIOMETRIC_BASE ?? "http://127.0.0.1:8001";

  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 5000);
    const up = await fetch(`${BASE}/fingerprint/status/${id}`, {
      signal: controller.signal,
      cache: "no-store",
    }).catch((e) => {
      clearTimeout(t);
      throw e;
    });
    clearTimeout(t);

    const j = await up.json().catch(() => ({} as any));
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
