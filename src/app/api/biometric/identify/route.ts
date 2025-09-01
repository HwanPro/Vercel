// app/api/biometric/identify/route.ts
import { NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";

const PY = process.env.PY_BASE_URL || "http://127.0.0.1:8001";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // 1) abrir (idempotente)
    await fetch(`${PY}/device/open`, { method: "POST" }).catch(() => null);

    // 2) capturar
    const cap = await fetch(`${PY}/device/capture`, { method: "POST" });
    const capData = await cap.json();
    if (!cap.ok || !capData?.ok || !capData?.template) {
      return NextResponse.json(
        { ok: false, message: capData?.message || "No se pudo capturar" },
        { status: 502 }
      );
    }

    // 3) identificar (1:N)
    const idResp = await fetch(`${PY}/identify-fingerprint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fingerprint: capData.template }),
    });
    const idData = await idResp.json();

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

    // 4) registrar asistencia si matcheó (igual que tu ruta /api/check-in)
    const userId = idData.user_id as string;

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();   todayEnd.setHours(23, 59, 59, 999);

    const existing = await prisma.attendance.findFirst({
      where: { userId, checkInTime: { gte: todayStart, lte: todayEnd } },
    });

    if (!existing) {
      await prisma.attendance.create({
        data: { userId, checkInTime: new Date() },
      });
    }

    // opcional: nombre para el saludo
    const user = await prisma.user.findUnique({ where: { id: userId } });

    return NextResponse.json(
      {
        ok: true,
        match: true,
        userId,
        name: user?.name || null,
        message: "Asistencia registrada por huella",
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
