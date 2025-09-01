// src/app/api/attendance/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";

export const dynamic = "force-dynamic";

/** ---------- Helpers de fecha (Lima) ----------
 * Si tu server corre en UTC y quieres tratar todo como Lima,
 * puedes restar 5 horas aquí. Por ahora usamos la hora local del servidor.
 */
function limaNow() {
  return new Date();
}
function todayRangeFrom(now: Date) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// Configurables
const REBOUND_SECONDS = 60;       // antirrebote entre toques
const MAX_ENTRIES_PER_DAY = 2;    // (p.ej. GYM + FULL BODY)

/* =========================
 *         GET
 * ========================= */
export async function GET() {
  try {
    const records = await prisma.attendance.findMany({
      orderBy: { checkInTime: "desc" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
          },
        },
      },
    });

    // Aseguramos userId en la respuesta (por si tu modelo cambia)
    const data = records.map((r) => ({
      id: r.id,
      userId: (r as any).userId ?? r.user.id,
      checkInTime: r.checkInTime,
      checkOutTime: r.checkOutTime ?? null,
      durationMins: r.durationMins ?? null,
      user: r.user,
    }));

    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("❌ GET /attendance failed:", err);
    return NextResponse.json(
      { message: "No se pudo obtener la asistencia" },
      { status: 500 }
    );
  }
}

/* =========================
 *         POST
 *   (registro por teléfono)
 * ========================= */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const normalized = String(body?.phone || "").replace(/\D/g, "").slice(-9);

    if (normalized.length !== 9) {
      return NextResponse.json(
        { message: "Número inválido", reason: "bad_phone" },
        { status: 400 }
      );
    }

    // 1) Resolvemos userId por clientProfile y caemos a users.phoneNumber
    const profile = await prisma.clientProfile.findFirst({
      where: {
        OR: [{ profile_phone: normalized }, { profile_phone: `+51${normalized}` }],
      },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });

    let userId: string | null = profile?.user?.id ?? null;

    if (!userId) {
      const userByPhone = await prisma.user.findFirst({
        where: { phoneNumber: normalized },
        select: { id: true },
      });
      userId = userByPhone?.id ?? null;
    }

    if (!userId) {
      return NextResponse.json(
        { message: "Número no encontrado", reason: "not_found" },
        { status: 404 }
      );
    }

    // 2) Definimos ventana del día y ahora
    const now = limaNow();
    const { start, end } = todayRangeFrom(now);

    // 3) Ejecutamos todo en una transacción (evita duplicados por carreras)
    const result = await prisma.$transaction(async (tx) => {
      // 3.1) Antirrebote: último check-in muy reciente y aún abierto
      const last = await tx.attendance.findFirst({
        where: { userId },
        orderBy: { checkInTime: "desc" },
      });

      if (
        last &&
        !last.checkOutTime &&
        last.checkInTime >= new Date(now.getTime() - REBOUND_SECONDS * 1000)
      ) {
        return { kind: "rebounce" as const, record: last };
      }

      // 3.2) ¿Tiene una asistencia abierta hoy? -> cerrar (check-out)
      const open = await tx.attendance.findFirst({
        where: {
          userId,
          checkInTime: { gte: start, lte: end },
          checkOutTime: null,
        },
        orderBy: { checkInTime: "desc" },
      });

      if (open) {
        const duration = Math.max(
          0,
          Math.round((now.getTime() - open.checkInTime.getTime()) / 60000)
        );
        const updated = await tx.attendance.update({
          where: { id: open.id },
          data: { checkOutTime: now, durationMins: duration },
        });
        return { kind: "checkout" as const, record: updated };
      }

      // 3.3) Límite de entradas por día
      const entriesCount = await tx.attendance.count({
        where: { userId, checkInTime: { gte: start, lte: end } },
      });
      if (entriesCount >= MAX_ENTRIES_PER_DAY) {
        return { kind: "limit" as const, record: null };
      }

      // 3.4) Crear nueva entrada (check-in)
      const created = await tx.attendance.create({
        data: { userId, checkInTime: now },
      });
      return { kind: "checkin" as const, record: created };
    });

    // 4) Respuesta
    if (result.kind === "rebounce") {
      return NextResponse.json({
        ok: true,
        ignored: true,
        reason: "rebote",
        message: "Registro ya tomado",
        record: result.record,
      });
    }
    if (result.kind === "checkout") {
      return NextResponse.json({
        ok: true,
        type: "checkout",
        message: "Salida registrada",
        record: result.record,
      });
    }
    if (result.kind === "limit") {
      return NextResponse.json(
        {
          ok: false,
          message: "Límite de entradas diarias alcanzado",
          reason: "limit_reached",
        },
        { status: 400 }
      );
    }

    // checkin
    return NextResponse.json({
      ok: true,
      type: "checkin",
      message: "Entrada registrada",
      record: result.record,
    });
  } catch (error) {
    console.error("❌ Error en POST /attendance:", error);
    return NextResponse.json(
      { message: "Error al registrar asistencia" },
      { status: 500 }
    );
  }
}
