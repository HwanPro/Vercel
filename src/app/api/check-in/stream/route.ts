// src/app/api/check-in/stream/route.ts
import { NextRequest } from "next/server";
import { addConnection, removeConnection } from "@/lib/stream-manager";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const room = searchParams.get("room") || "default";

  const stream = new ReadableStream({
    start(controller) {
      // Agregar conexión al gestor centralizado
      addConnection(room, controller);

      // Enviar evento inicial
      controller.enqueue(`data: ${JSON.stringify({ type: "connected", room })}\n\n`);

      // Cleanup cuando se cierra la conexión
      const cleanup = () => {
        removeConnection(room, controller);
      };

      // Detectar cuando se cierra la conexión
      request.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  });
}
