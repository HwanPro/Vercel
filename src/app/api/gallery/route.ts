// src/app/api/gallery/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file = data.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No se seleccionó ningún archivo" },
        { status: 400 }
      );
    }

    // Validar tipo y tamaño (opcional, similar a tu route actual)
    const allowedTypes = ["image/jpeg", "image/png"];
    const maxFileSize = 5 * 1024 * 1024;
    if (!allowedTypes.includes(file.type) || file.size > maxFileSize) {
      return NextResponse.json({ error: "Archivo inválido" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const today = new Date();
    const fileKey = `uploads/${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}/${uuidv4()}-${file.name}`;

    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: fileKey,
      Body: buffer,
      ContentType: file.type,
    };

    await s3Client.send(new PutObjectCommand(uploadParams));
    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

    // Guardar en la base de datos en la tabla Gallery:
    await prisma.gallery.create({
      data: { imageUrl: fileUrl },
    });

    return NextResponse.json(
      { message: "Archivo subido", fileUrl },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al subir archivo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT: Actualizar historia (se espera que en el body venga también el id)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id)
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    const updatedStory = await prisma.story.update({
      where: { id },
      data,
    });
    return NextResponse.json(updatedStory, { status: 200 });
  } catch (error) {
    console.error("Error PUT /api/stories:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar historia pasando el id como query parameter
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    await prisma.story.delete({ where: { id } });
    return NextResponse.json(
      { message: "Historia eliminada" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error DELETE /api/stories:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const images = await prisma.gallery.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(images, { status: 200 });
  } catch (error) {
    console.error("Error al obtener imágenes:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
