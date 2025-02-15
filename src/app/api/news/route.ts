import { NextResponse } from "next/server";
import prisma from "@/libs/prisma";

export async function GET() {
  const news = await prisma.news.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(news);
}

export async function POST(request: Request) {
  const { title, content, imageUrl } = await request.json();
  const news = await prisma.news.create({
    data: { title, content, imageUrl },
  });

  return NextResponse.json(news, { status: 201 });
}
