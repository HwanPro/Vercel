// app/api/biometric/identify/route.ts
import { NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";

const BASE = process.env.BIOMETRIC_BASE || "http://127.0.0.1:8001";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // 1) abrir (idempotente)
    await fetch(`${BASE}/device/open`, {
      method: "POST",
      cache: "no-store",
    }).catch(() => null);

    // 2) capturar
    const cap = await fetch(`${BASE}/device/capture`, {
      method: "POST",
      cache: "no-store",
    });
    const capData = await cap.json().catch(() => ({}) as any);
    if (!cap.ok || !capData?.ok || !capData?.template) {
      return NextResponse.json(
        { ok: false, message: capData?.message || "No se pudo capturar" },
        { status: 502 }
      );
    }

    // 3) Obtener todas las huellas registradas en la base de datos
    const registeredFingerprints = await prisma.fingerprint.findMany({
      select: {
        user_id: true,
        template: true,
      },
    });

    if (registeredFingerprints.length === 0) {
      return NextResponse.json(
        {
          ok: true,
          match: false,
          message: "No hay huellas registradas en el sistema",
        },
        { status: 200 }
      );
    }

    // 4) Verificar contra cada huella registrada
    let bestMatch = null;
    let bestScore = 0;

    for (const fp of registeredFingerprints) {
      try {
        const verifyResp = await fetch(`${BASE}/verify-fingerprint`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            template1: capData.template,
            template2: fp.template,
          }),
          cache: "no-store",
        });

        const verifyData = await verifyResp.json().catch(() => ({}));
        
        if (verifyResp.ok && verifyData?.match && verifyData?.score > bestScore) {
          bestMatch = {
            userId: fp.user_id,
            score: verifyData.score,
            threshold: verifyData.threshold,
          };
          bestScore = verifyData.score;
        }
      } catch (error) {
        console.error(`Error verificando huella para usuario ${fp.user_id}:`, error);
      }
    }

    if (!bestMatch) {
      return NextResponse.json(
        {
          ok: true,
          match: false,
          message: "Huella no registrada en ningún perfil",
        },
        { status: 200 }
      );
    }

    // 5) Obtener información del usuario y validar que tenga perfil activo
    const userId = bestMatch.userId;
    
    // Obtener información del usuario para el saludo
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

    // Validar que el usuario tenga un perfil activo
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

    // Verificar que la membresía no haya expirado
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

    const fullName = `${profile.profile_first_name} ${profile.profile_last_name}`.trim() || 
                     `${user.firstName} ${user.lastName}`.trim() || 
                     user.username;

    return NextResponse.json(
      {
        ok: true,
        match: true,
        userId,
        user_id: userId, // Compatibilidad
        fullName,
        name: fullName, // Compatibilidad
        score: bestMatch.score,
        threshold: bestMatch.threshold,
        message: "Usuario identificado correctamente",
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e?.message || "Fallo interno" },
      { status: 500 }
    );
  }
}
