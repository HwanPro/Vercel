// src/app/api/products/route.ts

import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import prisma from "@/libs/prisma";
import { v4 as uuidv4 } from "uuid";

// Configura el cliente de S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData(); // Lee el FormData
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ninguna imagen" },
        { status: 400 }
      );
    }

    // Genera un nombre único para la imagen
    const fileName = `${uuidv4()}-${file.name}`;
    const bucketName = process.env.AWS_S3_BUCKET_NAME!;
    const uploadKey = `uploads/${fileName}`;

    // Sube la imagen a S3
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const uploadParams = {
      Bucket: bucketName,
      Key: uploadKey,
      Body: fileBuffer,
      ContentType: file.type,
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    const imageUrl = `https://${bucketName}.s3.amazonaws.com/${uploadKey}`;

    // Guarda el producto en la base de datos
    const newProduct = await prisma.inventoryItem.create({
      data: {
        item_id: uuidv4(),
        item_name: formData.get("name") as string,
        item_description: formData.get("description") as string,
        item_price: parseFloat(formData.get("price") as string),
        item_discount: parseFloat(formData.get("discount") as string) || 0,
        item_stock: parseInt(formData.get("stock") as string, 10),
        item_image_url: imageUrl,
      },
    });

    return NextResponse.json(
      { message: "Producto creado con éxito", product: newProduct },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear el producto:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
