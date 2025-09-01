// src/app/api/check-in/route.ts
import { NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";

export const dynamic = "force-dynamic";

function limaNow() { return new Date(); }
function todayRangeLima() {
  const now = limaNow();
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  const end = new Date(now);   end.setHours(23, 59, 59, 999);
  return { start, end };
}
const REBOUND_SECONDS = 60;
const MAX_ENTRIES_PER_DAY = 2;

async function closeIfOpenOrCreate(userId: string) {
  const { start, end } = todayRangeLima();

  // Antirrebote
  const rebound = await prisma.attendance.findFirst({
    where: { userId, checkInTime: { gte: new Date(Date.now() - REBOUND_SECONDS * 1000) } },
    orderBy: { checkInTime: "desc" },
  });
  if (rebound && !rebound.checkOutTime) {
    return { ok: true as const, ignored: true as const, type: "rebote" as const };
  }

  // ¿Abierta?
  const open = await prisma.attendance.findFirst({
    where: { userId, checkInTime: { gte: start, lte: end }, checkOutTime: null },
    orderBy: { checkInTime: "desc" },
  });
  if (open) {
    const salida = limaNow();
    const duration = Math.max(
      0,
      Math.round((salida.getTime() - new Date(open.checkInTime).getTime()) / 60000)
    );
    const updated = await prisma.attendance.update({
      where: { id: open.id },
      data: { checkOutTime: salida, durationMins: duration },
    });
    return { ok: true as const, type: "checkout" as const, record: updated };
  }

  // Límite por día
  const count = await prisma.attendance.count({
    where: { userId, checkInTime: { gte: start, lte: end } },
  });
  if (count >= MAX_ENTRIES_PER_DAY) {
    return { ok: false as const, reason: "limit_reached" as const, message: "Límite de entradas diarias alcanzado" };
  }

  const created = await prisma.attendance.create({
    data: { userId, checkInTime: limaNow() },
  });
  return { ok: true as const, type: "checkin" as const, record: created };
}

async function getFullNameByUserId(userId: string) {
  // Perfil (tenías user_id)
  const profile = await prisma.clientProfile.findFirst({
    where: { user_id: userId },
    select: { profile_first_name: true, profile_last_name: true },
  });
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true },
  });

  const fromProfile = `${profile?.profile_first_name ?? ""} ${profile?.profile_last_name ?? ""}`.trim();
  const fromUser = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  return fromProfile || fromUser || undefined;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const userId: string | undefined = body?.userId;
    const phoneRaw: string | undefined = body?.phone;

    // ---- Flujo HUELLAS (userId) ----
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return NextResponse.json({ ok: false, message: "Usuario no encontrado", reason: "not_found" }, { status: 404 });
      }
      const res = await closeIfOpenOrCreate(user.id);
      if (!res.ok) {
        return NextResponse.json({ ok: false, message: res.message, reason: res.reason }, { status: 400 });
      }
      const fullName = await getFullNameByUserId(user.id);
      return NextResponse.json({
        ok: true,
        userId: user.id,
        fullName,
        type: res.type,
        message: res.type === "checkout" ? "Salida registrada" :
                 res.type === "rebote"   ? "Registro ya tomado" :
                 "Entrada registrada",
        record: (res as any).record ?? null,
      });
    }

    // ---- Flujo TELÉFONO (phone) ----
    if (phoneRaw) {
      const normalized = String(phoneRaw).replace(/\D/g, "").slice(-9);
      if (normalized.length !== 9) {
        return NextResponse.json({ ok: false, message: "Número inválido", reason: "bad_phone" }, { status: 400 });
      }

      const profile = await prisma.clientProfile.findFirst({
        where: { OR: [{ profile_phone: normalized }, { profile_phone: `+51${normalized}` }] },
        include: { user: true },
      });

      const userIdFromPhone = profile?.user?.id ?? (
        (await prisma.user.findFirst({ where: { phoneNumber: normalized }, select: { id: true } }))?.id
      );

      if (!userIdFromPhone) {
        return NextResponse.json({ ok: false, message: "Usuario no encontrado", reason: "not_found" }, { status: 404 });
      }

      const res = await closeIfOpenOrCreate(userIdFromPhone);
      if (!res.ok) {
        return NextResponse.json({ ok: false, message: res.message, reason: res.reason }, { status: 400 });
      }

      const fullName =
        `${profile?.profile_first_name ?? ""} ${profile?.profile_last_name ?? ""}`.trim() ||
        (await getFullNameByUserId(userIdFromPhone));

      return NextResponse.json({
        ok: true,
        userId: userIdFromPhone,
        fullName,
        type: res.type,
        message: res.type === "checkout" ? "Salida registrada" :
                 res.type === "rebote"   ? "Registro ya tomado" :
                 "Entrada registrada",
        record: (res as any).record ?? null,
      });
    }

    return NextResponse.json({ ok: false, message: "Se requiere 'userId' o 'phone'" }, { status: 400 });
  } catch (e: any) {
    console.error("check-in error:", e);
    return NextResponse.json({ ok: false, message: e?.message || "Error interno" }, { status: 500 });
  }
}
