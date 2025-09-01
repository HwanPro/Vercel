import { NextRequest, NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";

export const dynamic = "force-dynamic";

// PATCH: corrige checkInTime / checkOutTime / type
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await req.json().catch(() => ({}));
    const data: any = {};
    if (body.checkInTime)  data.checkInTime  = new Date(body.checkInTime);
    if (body.checkOutTime) data.checkOutTime = new Date(body.checkOutTime);
    if (typeof body.durationMins === "number") data.durationMins = body.durationMins;
    if (typeof body.type === "string") data.type = body.type;

    const updated = await prisma.attendance.update({ where: { id }, data });
    return NextResponse.json({ ok: true, record: updated });
  } catch (e) {
    return NextResponse.json({ ok: false, message: "No se pudo actualizar" }, { status: 500 });
  }
}

// DELETE: elimina el registro
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.attendance.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, message: "No se pudo eliminar" }, { status: 500 });
  }
}
