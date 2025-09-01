// utils/biometric.ts
export async function detectLocalAgent(base = process.env.NEXT_PUBLIC_BIOMETRIC_BASE || "http://127.0.0.1:8000") {
    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 800);
      const r = await fetch(`${base}/health`, { signal: ctrl.signal });
      return r.ok ? base : null;
    } catch { return null; }
  }
  