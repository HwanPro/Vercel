// src/app/api/check-in/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";
import { broadcastToRoom } from "@/lib/stream-manager";
export const dynamic = "force-dynamic";

/* ================= Utils ================= */
function limaNow() {
  // Si más adelante quieres forzar TZ, adapta aquí
  return new Date();
}
function todayRangeLima() {
  const now = limaNow();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}
function calcDaysLeft(endDate?: Date | null) {
  if (!endDate) return null;
  const today = new Date();
  const floorToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = endDate.getTime() - floorToday.getTime();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil(diff / ONE_DAY));
}
function only9Digits(pePhoneLike: string) {
  const d = String(pePhoneLike || "").replace(/\D/g, "");
  // devolver últimos 9 para casos con +51
  return d.slice(-9);
}

/* ============== Reglas de asistencia ============== */
const REBOUND_SECONDS = 60;      // antirrebote (segundos)
const MAX_ENTRIES_PER_DAY = 2;   // cantidad máxima de entradas por día

async function closeIfOpenOrCreate(userId: string) {
  const { start, end } = todayRangeLima();

  // Antirrebote: si acaban de hacer check-in abierto, ignorar
  const rebound = await prisma.attendance.findFirst({
    where: {
      userId,
      checkInTime: { gte: new Date(Date.now() - REBOUND_SECONDS * 1000) },
    },
    orderBy: { checkInTime: "desc" },
  });
  if (rebound && !rebound.checkOutTime) {
    return { ok: true as const, ignored: true as const, type: "rebote" as const };
  }

  // ¿Hay sesión abierta hoy?
  const open = await prisma.attendance.findFirst({
    where: { userId, checkInTime: { gte: start, lte: end }, checkOutTime: null },
    orderBy: { checkInTime: "desc" },
  });

  if (open) {
    // Cerrar (checkout)
    const salida = limaNow();
    const durationMins = Math.max(
      0,
      Math.round((salida.getTime() - new Date(open.checkInTime).getTime()) / 60000)
    );
    const updated = await prisma.attendance.update({
      where: { id: open.id },
      data: { checkOutTime: salida, durationMins },
    });
    return { ok: true as const, type: "checkout" as const, record: updated };
  }

  // Límite por día (solo contamos check-ins del día)
  const count = await prisma.attendance.count({
    where: { userId, checkInTime: { gte: start, lte: end } },
  });
  if (count >= MAX_ENTRIES_PER_DAY) {
    return {
      ok: false as const,
      reason: "limit_reached" as const,
      message: "Límite de entradas diarias alcanzado",
    };
  }

  // Crear (checkin)
  const created = await prisma.attendance.create({
    data: { userId, checkInTime: limaNow() },
  });
  return { ok: true as const, type: "checkin" as const, record: created };
}

/* ============= Perfil / datos a mostrar ============= */
async function getProfileInfo(userId: string) {
  // User (por si tienes avatar u otros)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true, username: true, image: true },
  });

  // ClientProfile (nombres, fechas, deuda, plan)
  const profile = await prisma.clientProfile.findUnique({
    where: { user_id: userId },
    select: {
      profile_id: true,
      profile_first_name: true,
      profile_last_name: true,
      profile_start_date: true,
      profile_end_date: true,
      profile_phone: true,
      profile_plan: true,
      debt: true, // Decimal(10,2) - deuda mensual
    },
  });

  const fullName =
    `${profile?.profile_first_name ?? ""} ${profile?.profile_last_name ?? ""}`
      .trim() ||
    `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() ||
    user?.username ||
    undefined;

  // Coerce Decimal -> number (o 0 si null/undefined)
  const monthlyDebt =
    profile?.debt !== null && profile?.debt !== undefined
      ? Number(profile.debt)
      : 0;

  // Debug: Log para verificar la deuda mensual
  console.log(`Debug - Usuario: ${fullName}, Deuda mensual raw:`, profile?.debt, 'Procesada:', monthlyDebt);

  // Obtener deudas diarias
  let dailyDebt = 0;
  if (profile?.profile_id) {
    try {
      const dailyDebts = await (prisma as any).dailyDebt.findMany({
        where: { clientProfileId: profile.profile_id },
      });
      dailyDebt = dailyDebts.reduce((sum: number, debt: any) => sum + Number(debt.amount), 0);
    } catch (error) {
      // Si el modelo no existe aún, usar 0
      dailyDebt = 0;
    }
  }

  const daysLeft = calcDaysLeft(profile?.profile_end_date);

  return {
    fullName,
    plan: profile?.profile_plan ?? null,
    startDate: profile?.profile_start_date ?? null,
    endDate: profile?.profile_end_date ?? null,
    monthlyDebt,
    dailyDebt,
    totalDebt: monthlyDebt + dailyDebt,
    daysLeft,
    avatarUrl: user?.image ?? null,
    profileId: profile?.profile_id ?? null,
  };
}

/* ==================== Handler ==================== */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const userId: string | undefined = body?.userId;
    const phoneRaw: string | undefined = body?.phone;

    // ---- HUELLAS (userId) ----
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return NextResponse.json(
          { ok: false, message: "Usuario no encontrado", reason: "not_found" },
          { status: 404 }
        );
      }

      const res = await closeIfOpenOrCreate(user.id);
      if (!res.ok) {
        return NextResponse.json(
          { ok: false, message: res.message, reason: res.reason },
          { status: 400 }
        );
      }

      const info = await getProfileInfo(user.id);

      const responseData = {
        ok: true,
        userId: user.id,
        fullName: info.fullName,
        plan: info.plan,
        startDate: info.startDate,
        endDate: info.endDate,
        daysLeft: info.daysLeft,
        monthlyDebt: info.monthlyDebt,
        dailyDebt: info.dailyDebt,
        totalDebt: info.totalDebt,
        avatarUrl: info.avatarUrl,
        profileId: info.profileId,
        action: res.type === "checkout" ? "checkout" : "checkin",
        type: res.type,
        message:
          res.type === "checkout"
            ? "Salida registrada"
            : res.type === "rebote"
              ? "Registro ya tomado"
              : "Entrada registrada",
        record: (res as any).record ?? null,
        minutesOpen: res.type === "checkout" ? (res as any).record?.durationMins : undefined,
      };

      // Broadcast a todas las salas (o puedes usar una sala específica)
      if (res.type !== "rebote") {
        broadcastToRoom("default", responseData);
      }

      return NextResponse.json(responseData);
    }

    // ---- TELÉFONO (phone) ----
    if (phoneRaw) {
      const last9 = only9Digits(phoneRaw);
      if (last9.length !== 9) {
        return NextResponse.json(
          { ok: false, message: "Número inválido", reason: "bad_phone" },
          { status: 400 }
        );
      }

      // Busca en profile por 9 dígitos o +51XXXXXXXXX
      const profile = await prisma.clientProfile.findFirst({
        where: {
          OR: [
            { profile_phone: last9 },
            { profile_phone: `+51${last9}` },
            { profile_phone: `51${last9}` },
          ],
        },
        include: { user: { select: { id: true } } },
      });

      // Fallback: user.phoneNumber
      const userIdFromPhone =
        profile?.user?.id ??
        (
          await prisma.user.findFirst({
            where: {
              OR: [{ phoneNumber: last9 }, { phoneNumber: `+51${last9}` }, { phoneNumber: `51${last9}` }],
            },
            select: { id: true },
          })
        )?.id;

      if (!userIdFromPhone) {
        return NextResponse.json(
          { ok: false, message: "Usuario no encontrado", reason: "not_found" },
          { status: 404 }
        );
      }

      const res = await closeIfOpenOrCreate(userIdFromPhone);
      if (!res.ok) {
        return NextResponse.json(
          { ok: false, message: res.message, reason: res.reason },
          { status: 400 }
        );
      }

      const info = await getProfileInfo(userIdFromPhone);

      const responseData = {
        ok: true,
        userId: userIdFromPhone,
        fullName: info.fullName,
        plan: info.plan,
        startDate: info.startDate,
        endDate: info.endDate,
        daysLeft: info.daysLeft,
        monthlyDebt: info.monthlyDebt,
        dailyDebt: info.dailyDebt,
        totalDebt: info.totalDebt,
        avatarUrl: info.avatarUrl,
        profileId: info.profileId,
        action: res.type === "checkout" ? "checkout" : "checkin",
        type: res.type,
        message:
          res.type === "checkout"
            ? "Salida registrada"
            : res.type === "rebote"
              ? "Registro ya tomado"
              : "Entrada registrada",
        record: (res as any).record ?? null,
        minutesOpen: res.type === "checkout" ? (res as any).record?.durationMins : undefined,
      };

      // Broadcast a todas las salas
      if (res.type !== "rebote") {
        broadcastToRoom("default", responseData);
      }

      return NextResponse.json(responseData);
    }

    return NextResponse.json(
      { ok: false, message: "Se requiere 'userId' o 'phone'" },
      { status: 400 }
    );
  } catch (e: any) {
    console.error("check-in error:", e);
    return NextResponse.json(
      { ok: false, message: e?.message || "Error interno" },
      { status: 500 }
    );
  }
}
