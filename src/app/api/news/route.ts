// src/app/api/news/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";
import { z, ZodError } from "zod";

const newsSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  content: z.string().min(1, "El contenido es obligatorio"),
  imageUrl: z.string().optional(),
});

export async function GET() {
  try {
    const newsList = await prisma.news.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(newsList, { status: 200 });
  } catch (error) {
    console.error("Error GET /api/news:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, imageUrl } = newsSchema.parse(body);

    const newNews = await prisma.news.create({
      data: { title, content, imageUrl: imageUrl ?? null },
    });

    return NextResponse.json(newNews, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error al crear noticia:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
