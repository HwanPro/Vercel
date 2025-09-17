import { NextRequest } from "next/server";
import { rt, RTEvent } from "@/lib/realtime";

export const runtime = "nodejs"; // importante para mantener la conexión

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: RTEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(`:\n\n`));
      }, 15000);

      const listener = (evt: RTEvent) => send(evt);
      rt.on("realtime", listener);

      req.signal.addEventListener("abort", () => {
        clearInterval(keepAlive);
        rt.off("realtime", listener);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
