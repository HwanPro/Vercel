// app/api/user/username/route.ts
import { NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";
import { z } from "zod";
import { getToken } from "next-auth/jwt";

const Schema = z.object({
  newUsername: z.string().email(), // queremos correo
});

export async function PUT(req: Request) {
  try {
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { newUsername } = Schema.parse(await req.json());

    // verifica unicidad
    const exists = await prisma.user.findUnique({ where: { username: newUsername } });
    if (exists) {
      return NextResponse.json({ error: "Ese correo ya está en uso" }, { status: 409 });
    }

    await prisma.user.update({
      where: { id: token.id as string },
      data: { username: newUsername },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("PUT /api/user/username", e);
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }
}
