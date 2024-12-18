import { NextRequest, NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { v4 as uuidv4 } from "uuid";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Configuración de AWS S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Definir el entorno para el API route
export const runtime = "nodejs";

// Obtener productos
export async function GET() {
  try {
    const products = await prisma.inventoryItem.findMany();
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return NextResponse.json(
      { error: "Error interno al obtener los productos" },
      { status: 500 }
    );
  }
}

// Crear producto
export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const item_name = data.get("item_name") as string;
    const item_description = data.get("item_description") as string;
    const item_price = parseFloat(data.get("item_price") as string);
    const item_discount = parseFloat(data.get("item_discount") as string) || 0;
    const item_stock = parseInt(data.get("item_stock") as string, 10);
    const file = data.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Archivo no válido o no proporcionado" },
        { status: 400 }
      );
    }

    // Subir a S3
    const buffer = Buffer.from(await file.arrayBuffer());
    const uniqueFileName = `${uuidv4()}-${file.name}`;

    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: `uploads/${uniqueFileName}`,
      Body: buffer,
      ContentType: file.type,
    };

    await s3Client.send(new PutObjectCommand(uploadParams));
    const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/uploads/${uniqueFileName}`;

    // Crear producto en la base de datos
    const newProduct = await prisma.inventoryItem.create({
      data: {
        item_id: uuidv4(),
        item_name,
        item_description,
        item_price,
        item_discount,
        item_stock,
        item_image_url: imageUrl,
      },
    });

    return NextResponse.json({ product: newProduct }, { status: 201 });
  } catch (error) {
    console.error("Error al crear el producto:", error);
    return NextResponse.json(
      { error: "Error interno al crear el producto" },
      { status: 500 }
    );
  }
}
