// src/app/api/products/route.ts

import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import prisma from "@/libs/prisma"; // Asegúrate de importar Prisma correctamente

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const itemName = formData.get("name") as string;

    if (!file) {
      return NextResponse.json(
        { error: "Archivo no proporcionado" },
        { status: 400 }
      );
    }

    // Leer el buffer del archivo
    const buffer = Buffer.from(await file.arrayBuffer());
    const uniqueFileName = `${uuidv4()}-${file.name}`;

    // Parámetros para subir a S3
    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: `uploads/${uniqueFileName}`,
      Body: buffer,
      ContentType: file.type,
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    // URL de la imagen subida
    const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${uploadParams.Key}`;

    // Guarda el producto en la base de datos
    const newProduct = await prisma.inventoryItem.create({
      data: {
        item_id: uuidv4(),
        item_name: itemName,
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
