// src/app/api/biometric/register/[id]/route.ts
import { NextResponse } from "next/server";
const BASE = process.env.FASTAPI_URL || "http://127.0.0.1:8001";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ ok: false, message: "Falta id de usuario" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const templates = Array.isArray(body?.templates) ? (body.templates as string[]) : null;
    const template = typeof body?.template === "string" ? (body.template as string) : null;

    const url =
      templates && templates.length >= 2
        ? `${BASE}/register-fingerprint-multi`
        : `${BASE}/register-fingerprint`;

    const payload =
      templates && templates.length >= 2
        ? { user_id: id, fingerprints: templates }
        : { user_id: id, fingerprint: template };

    const up = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // opcional: timeout manual si quieres
    });

    const j = await up.json().catch(() => ({}));
    const ok = up.ok && j?.ok !== false;

    return NextResponse.json(
      ok ? j : { ok: false, message: j?.message || "Error registrando" },
      { status: ok ? 200 : up.status || 500 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err?.message || "Fallo inesperado" },
      { status: 500 }
    );
  }
}
