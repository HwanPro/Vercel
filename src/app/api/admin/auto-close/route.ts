import { NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";

export const dynamic = "force-dynamic";

// POST: cierra abiertas del día
export async function POST() {
  try {
    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date();   end.setHours(23,59,59,999);

    const opened = await prisma.attendance.findMany({
      where: { checkInTime: { gte: start, lte: end }, checkOutTime: null },
    });

    let closed = 0;
    for (const r of opened) {
      const out = new Date();
      const duration = Math.max(0, Math.round((out.getTime() - new Date(r.checkInTime).getTime())/60000));
      await prisma.attendance.update({ where: { id: r.id }, data: { checkOutTime: out, durationMins: duration } });
      closed++;
    }

    return NextResponse.json({ ok: true, closed });
  } catch (e) {
    return NextResponse.json({ ok: false, message: "falló autocierre" }, { status: 500 });
  }
}
