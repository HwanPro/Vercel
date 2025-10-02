// app/api/biometric/identify/route.ts
import { NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";

// Separar bases por servicio: captura (C#) e identificación (Python)
const CAPTURE_BASE =
  process.env.BIOMETRIC_CAPTURE_BASE ||
  process.env.BIOMETRIC_BASE ||
  "http://127.0.0.1:8002";
const IDENTIFY_BASE =
  process.env.BIOMETRIC_STORE_BASE ||
  process.env.NEXT_PUBLIC_BIOMETRIC_BASE ||
  "http://127.0.0.1:8001";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 0) Leer body opcional con template (para clientes que ya capturan)
    type IdentifyBody = { template?: string | null; fingerprint?: string | null };
    const body = (await req.json().catch(() => ({}))) as IdentifyBody | undefined;

    let templateBase64: string | null = null;
    if (typeof body?.template === "string" && body.template.length > 0) {
      templateBase64 = body.template;
    } else if (typeof body?.fingerprint === "string" && body.fingerprint.length > 0) {
      templateBase64 = body.fingerprint;
    }

    // 1) Si no recibimos template, capturar desde el servicio C#
    if (!templateBase64) {
      await fetch(`${CAPTURE_BASE}/device/open`, {
        method: "POST",
        cache: "no-store",
      }).catch(() => null);

      const cap = await fetch(`${CAPTURE_BASE}/capture`, {
        method: "POST",
        cache: "no-store",
      });
      const capData = (await cap.json().catch(() => ({}))) as {
        ok?: boolean;
        template?: string;
        message?: string;
        code?: number;
        reason?: string;
      };
      if (!cap.ok || !capData?.ok || !capData?.template) {
        // Si no se puede capturar (no hay dedo), retornar sin error
        if (capData?.code === -8 || capData?.reason === "NO_FINGER") {
          return NextResponse.json(
            { ok: true, match: false, message: "No hay dedo en el lector" },
            { status: 200 }
          );
        }
        return NextResponse.json(
          { ok: false, message: capData?.message || "No se pudo capturar" },
          { status: 502 }
        );
      }
      templateBase64 = capData.template as string;
    }

    // 2) Identificar en el servicio Python (1:N)
    const identifyResp = await fetch(`${IDENTIFY_BASE}/identify-fingerprint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fingerprint: templateBase64 }),
      cache: "no-store",
    });
    const identifyData = (await identifyResp.json().catch(() => ({}))) as {
      ok?: boolean;
      match?: boolean;
      userId?: string;
      user_id?: string;
      score?: number;
      threshold?: number;
      message?: string;
    };

    if (!identifyResp.ok || !identifyData?.ok || !identifyData?.match) {
      return NextResponse.json(
        {
          ok: true,
          match: false,
          message: identifyData?.message || "Huella no registrada en ningún perfil",
        },
        { status: 200 }
      );
    }

    const bestMatch = {
      userId: identifyData.userId || identifyData.user_id,
      score: identifyData.score,
      threshold: identifyData.threshold,
    };

    if (!bestMatch?.userId) {
      return NextResponse.json(
        {
          ok: true,
          match: false,
          message: "Huella no registrada en ningún perfil",
        },
        { status: 200 }
      );
    }

    // 3) Obtener información del usuario y validar perfil activo
    const userId = bestMatch.userId as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          ok: true,
          match: false,
          message: "Usuario no encontrado en la base de datos",
        },
        { status: 200 }
      );
    }

    const profile = await prisma.clientProfile.findUnique({
      where: { user_id: userId },
      select: {
        profile_id: true,
        profile_first_name: true,
        profile_last_name: true,
        profile_end_date: true,
      },
    });

    if (!profile) {
      return NextResponse.json(
        {
          ok: true,
          match: false,
          message: "Usuario sin perfil de cliente activo",
        },
        { status: 200 }
      );
    }

    if (profile.profile_end_date && profile.profile_end_date < new Date()) {
      return NextResponse.json(
        {
          ok: true,
          match: false,
          message: "Membresía expirada",
        },
        { status: 200 }
      );
    }

    const fullName =
      `${profile.profile_first_name} ${profile.profile_last_name}`.trim() ||
      `${user.firstName} ${user.lastName}`.trim() ||
      user.username;

    return NextResponse.json(
      {
        ok: true,
        match: true,
        userId,
        user_id: userId, // compat
        fullName,
        name: fullName, // compat
        score: bestMatch.score,
        threshold: bestMatch.threshold,
        message: "Usuario identificado correctamente",
      },
      { status: 200 }
    );
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, message: (e as Error)?.message || "Fallo interno" },
      { status: 500 }
    );
  }
}
