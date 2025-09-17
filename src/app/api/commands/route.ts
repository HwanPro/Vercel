// src/app/api/commands/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Sender = (chunk: string) => void;

// Un bus en memoria por "room"
const rooms = new Map<string, Set<Sender>>();
const enc = new TextEncoder();

function broadcast(room: string, payload: any) {
  const set = rooms.get(room);
  if (!set || set.size === 0) return;
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const send of set) send(data);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const room = searchParams.get("room") || "default";

  const stream = new ReadableStream({
    start(controller) {
      const send: Sender = (chunk: string) => controller.enqueue(enc.encode(chunk));
      if (!rooms.has(room)) rooms.set(room, new Set());
      rooms.get(room)!.add(send);

      // saludo inicial (útil para probar conexión)
      send(`event: ping\ndata: "connected"\n\n`);
    },
    cancel() {
      const set = rooms.get(room);
      if (!set) return;
      // El GC eliminará el sender al cerrar el stream (no quedará referencia)
      // No necesitamos buscar el sender exacto aquí.
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !body.action) {
    return NextResponse.json({ ok: false, message: "action requerida" }, { status: 400 });
  }
  const room = body.room || "default";
  broadcast(room, body);
  return NextResponse.json({ ok: true });
}

// Preflight si lo necesitas
export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "content-type",
    },
  });
}
