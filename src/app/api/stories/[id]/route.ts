// src/app/api/stories/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params; // Extraído del [id]
    await prisma.story.delete({ where: { id } });
    return NextResponse.json(
      { message: "Historia eliminada" },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
