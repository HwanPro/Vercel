// app/api/biometric/ping/route.ts
const BASE = process.env.BIOMETRIC_BASE || "http://127.0.0.1:8002";
export const dynamic = "force-dynamic";

export async function GET() {
  const r = await fetch(`${BASE}/ping`, { cache: "no-store" });
  return new Response(await r.text(), {
    status: r.status,
    headers: { "Content-Type": r.headers.get("Content-Type") ?? "application/json" },
  });
}
