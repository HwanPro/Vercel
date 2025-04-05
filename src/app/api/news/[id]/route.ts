// src/app/api/news/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";
import { z, ZodError } from "zod";

const newsUpdateSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  imageUrl: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const newsItem = await prisma.news.findUnique({
      where: { id: params.id },
    });
    if (!newsItem) {
      return NextResponse.json(
        { error: "Noticia no encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json(newsItem, { status: 200 });
  } catch (error) {
    console.error("Error GET /api/news/[id]:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const data = newsUpdateSchema.parse(body);

    const updated = await prisma.news.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error PUT /api/news/[id]:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.news.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Noticia eliminada" }, { status: 200 });
  } catch (error) {
    console.error("Error DELETE /api/news/[id]:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
