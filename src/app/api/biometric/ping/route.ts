// app/api/biometric/ping/route.ts
export async function GET() {
  const r = await fetch("http://127.0.0.1:8001/ping", { cache: "no-store" });
  return new Response(r.body, { status: r.status, headers: { "Content-Type": "application/json" }});
}
