import { NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";

export async function POST(req: Request) {
  try {
    const { userId, phone, identifier, dni } = await req.json();
    const raw = String(identifier || dni || phone || "").replace(/\D/g, "");
    const normalizedPhone = raw.length >= 9 ? raw.slice(-9) : "";
    const normalizedDni = raw.length === 8 ? raw : "";

    if (!userId || (!normalizedPhone && !normalizedDni)) {
      return NextResponse.json(
        { ok: false, message: "Ingresa teléfono de 9 dígitos o DNI de 8 dígitos" },
        { status: 400 },
      );
    }

    const profile = await prisma.clientProfile.findFirst({
      where: {
        OR: [
          ...(normalizedPhone
            ? [{ profile_phone: normalizedPhone }, { profile_phone: `+51${normalizedPhone}` }]
            : []),
          ...(normalizedDni ? [{ documentNumber: normalizedDni }] : []),
        ],
      },
      include: { user: true },
    });

    if (!profile?.user || profile.user.id !== userId) {
      return NextResponse.json({ ok: false, message: "Teléfono no coincide con el usuario", reason: "mismatch" }, { status: 400 });
    }

    const fullName = `${profile.user.firstName ?? ""} ${profile.user.lastName ?? ""}`.trim();
    return NextResponse.json({ ok: true, userId, fullName });
  } catch {
    return NextResponse.json({ ok: false, message: "Error validando" }, { status: 500 });
  }
}
