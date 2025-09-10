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

    // 3) identificar (1:N)
    const idResp = await fetch(`${BASE}/identify-fingerprint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fingerprint: capData.template }),
      cache: "no-store",
    });
    const idData = await idResp.json().catch(() => ({}) as any);

    if (!idResp.ok) {
      return NextResponse.json(
        { ok: false, message: idData?.message || "Error al identificar" },
        { status: 502 }
      );
    }

    if (!idData?.match || !idData?.user_id) {
      return NextResponse.json(
        {
          ok: true,
          match: false,
          message: "No identificado",
          score: idData?.score,
          threshold: idData?.threshold,
        },
        { status: 200 }
      );
    }

    // 4) Obtener información del usuario y registrar asistencia
    const userId = idData.user_id as string;
    
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

    const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : null;

    // 5) Registrar asistencia (si no existe hoy)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const existing = await prisma.attendance.findFirst({
      where: { userId, checkInTime: { gte: todayStart, lte: todayEnd } },
    });

    if (!existing) {
      await prisma.attendance.create({
        data: { userId, checkInTime: new Date() },
      });
    }

    return NextResponse.json(
      {
        ok: true,
        match: true,
        userId,
        user_id: userId, // Compatibilidad
        fullName,
        name: fullName, // Compatibilidad
        score: idData?.score,
        threshold: idData?.threshold,
        message: "Usuario identificado",
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
