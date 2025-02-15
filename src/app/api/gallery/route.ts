import { NextResponse } from "next/server";
import prisma from "@/libs/prisma";

export async function GET() {
  const images = await prisma.gallery.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(images);
}

export async function POST(request: Request) {
  const { imageUrl } = await request.json();
  const image = await prisma.gallery.create({
    data: { imageUrl },
  });

  return NextResponse.json(image, { status: 201 });
}
