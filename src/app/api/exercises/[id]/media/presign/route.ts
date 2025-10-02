import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Esquema de validación para presigned URL
const presignSchema = z.object({
  type: z.enum(["image", "video"]),
  contentType: z.string().refine((type) => {
    const allowedTypes = [
      // Imágenes
      "image/jpeg", "image/jpg", "image/png", "image/webp",
      // Videos
      "video/mp4", "video/webm", "video/mov", "video/avi"
    ];
    return allowedTypes.includes(type);
  }, "Tipo de archivo no permitido"),
  filename: z.string().min(1)
});

// POST - Generar presigned URL para subir media
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const { type, contentType, filename } = presignSchema.parse(body);

    // Verificar que el ejercicio existe
    const exercise = await prisma.exercise.findUnique({
      where: { id: params.id }
    });

    if (!exercise) {
      return NextResponse.json(
        { error: "Ejercicio no encontrado" },
        { status: 404 }
      );
    }

    // Generar nombre único para el archivo
    const fileExtension = filename.split(".").pop();
    const uniqueFilename = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExtension}`;
    
    const folder = type === "image" ? "exercises/images" : "exercises/videos";
    const fileKey = `${folder}/${uniqueFilename}`;

    // Generar presigned URL
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: fileKey,
      ContentType: contentType,
      Metadata: {
        exerciseId: params.id,
        uploadedBy: session.user.id!
      }
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    const publicUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

    return NextResponse.json({
      uploadUrl,
      publicUrl,
      fileKey
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error al generar presigned URL:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
