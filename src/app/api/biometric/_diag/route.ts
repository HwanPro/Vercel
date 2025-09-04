// app/api/biometric/_diag/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const BASE = process.env.BIOMETRIC_BASE || 'UNSET';
  const url = BASE === 'UNSET' ? null : `${BASE}/ping`;

  try {
    console.log('[BIOMETRIC/_diag] BASE=', BASE, 'URL=', url);
    if (!url) {
      return new Response(JSON.stringify({ ok: false, reason: 'BIOMETRIC_BASE unset' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }

    const r = await fetch(url, { cache: 'no-store' });
    const text = await r.text().catch(() => '');
    console.log('[BIOMETRIC/_diag] upstream status', r.status, 'body', text.slice(0, 200));

    return new Response(
      JSON.stringify({ ok: true, env: BASE, upstreamStatus: r.status, upstreamBody: text }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  } catch (e: any) {
    console.error('[BIOMETRIC/_diag] error', e?.message || e);
    return new Response(JSON.stringify({ ok: false, error: e?.message || 'fetch failed' }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }
}
