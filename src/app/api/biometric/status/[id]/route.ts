// src/app/api/biometric/status/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const BASE =
    process.env.BIOMETRIC_STORE_BASE ||
    process.env.NEXT_PUBLIC_BIOMETRIC_BASE ||
    "http://127.0.0.1:8002";

  try {
    // 1. Verificar primero en la base de datos
    const dbFingerprint = await prisma.fingerprint.findFirst({
      where: { user_id: id }
    });

    // 2. Si hay huella en BD, verificar con el servicio biométrico
    if (dbFingerprint) {
      try {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 3000);
        const up = await fetch(`${BASE}/fingerprint/status/${id}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        clearTimeout(t);

        if (up.ok) {
          const j = await up.json().catch(() => ({}));
          return NextResponse.json({
            ok: true,
            hasFingerprint: true,
            inDatabase: true,
            inBiometricService: j?.hasFingerprint || false,
            message: "Huella registrada en base de datos"
          });
        }
      } catch (error) {
        console.log(`Servicio biométrico no disponible para usuario ${id}:`, error);
      }

      // Si el servicio no responde pero hay huella en BD
      return NextResponse.json({
        ok: true,
        hasFingerprint: true,
        inDatabase: true,
        inBiometricService: false,
        message: "Huella registrada (servicio biométrico no disponible)"
      });
    }

    // 3. Si no hay huella en BD, verificar solo el servicio biométrico
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 3000);
      const up = await fetch(`${BASE}/fingerprint/status/${id}`, {
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(t);

      if (up.ok) {
        const j = await up.json().catch(() => ({}));
        return NextResponse.json({
          ok: true,
          hasFingerprint: j?.hasFingerprint || false,
          inDatabase: false,
          inBiometricService: j?.hasFingerprint || false,
          message: j?.hasFingerprint ? "Huella solo en servicio biométrico" : "Sin huella registrada"
        });
      }
    } catch (error) {
      console.log(`Servicio biométrico no disponible para usuario ${id}:`, error);
    }

    // 4. Ni en BD ni en servicio
    return NextResponse.json({
      ok: true,
      hasFingerprint: false,
      inDatabase: false,
      inBiometricService: false,
      message: "Sin huella registrada"
    });

  } catch (error) {
    console.error("Error verificando estado de huella:", error);
    return NextResponse.json(
      { ok: false, hasFingerprint: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
