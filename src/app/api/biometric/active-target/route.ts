// src/app/api/biometric/active-target/route.ts
import { NextRequest, NextResponse } from "next/server";

// Nota: variable de módulo para dev/kiosk local. No persistente.
let currentTarget: { userId?: string; updatedAt?: number } = {};

export async function GET() {
  return NextResponse.json({ ok: true, userId: currentTarget.userId ?? null });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { userId?: string };
    const id = typeof body?.userId === "string" && body.userId.length > 0 ? body.userId : undefined;
    currentTarget = { userId: id, updatedAt: Date.now() };
    return NextResponse.json({ ok: true, userId: id ?? null });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, message: (e as Error)?.message || "error" }, { status: 400 });
  }
}

export async function DELETE() {
  currentTarget = {};
  return NextResponse.json({ ok: true });
}



