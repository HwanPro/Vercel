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

// GET → Obtener galería completa
export async function GET() {
  try {
    const images = await prisma.gallery.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(images, { status: 200 });
  } catch (error) {
    console.error("Error al obtener imágenes:", error);
    // Fallback seguro → lista vacía
    return NextResponse.json([], { status: 200 });
  }
}

// POST → Subir imagen y guardar en DB
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

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
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

    const newImage = await prisma.gallery.create({
      data: { imageUrl: fileUrl },
    });

    return NextResponse.json(
      { message: "Imagen subida correctamente", item: newImage },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al subir archivo:", error);
    return NextResponse.json(
      { error: "Error al subir archivo" },
      { status: 500 }
    );
  }
}
