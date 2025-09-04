// app/api/biometric/verify/[id]/route.ts
import { NextResponse } from "next/server";

const BASE = process.env.BIOMETRIC_BASE || "http://127.0.0.1:8001";
export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  // 1) Captura directa
  const capRes = await fetch(`${BASE}/device/capture`, {
    method: "POST",
    cache: "no-store",
  });
  const cap = await capRes
    .json()
    .catch(() => ({ ok: false, template: null, message: null }) as const);
  if (!capRes.ok || !cap?.ok || !cap?.template) {
    const msg = cap?.message || "No se pudo capturar la huella";
    return NextResponse.json(
      { ok: false, match: false, message: msg },
      { status: 400 }
    );
  }

  // 2) Verificar contra usuario
  const up = await fetch(`${BASE}/verify-fingerprint`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: id, fingerprint: cap.template }),
    cache: "no-store",
  });

  const raw = await up.json().catch(() => ({}) as any);
  const ok = up.ok && raw?.ok !== false;
  const match = !!raw?.match;
  const message =
    raw?.message ??
    (ok ? (match ? "Huella verificada" : "No coincide") : "Error verificando");

  return NextResponse.json(
    { ok, match, score: raw?.score ?? null, message, data: raw },
    { status: ok ? 200 : up.status || 500 }
  );
}
