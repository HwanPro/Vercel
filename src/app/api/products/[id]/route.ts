import { NextRequest, NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

// Cargar variables de entorno desde .env.local
dotenv.config({ path: ".env.local" });

// Configuración de S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Tipo para el contexto de parámetros
type ContextParams = {
  params: {
    id: string;
  };
};

// Eliminar producto por ID
export async function DELETE(req: NextRequest, context: ContextParams) {
  try {
    const { id } = context.params;

    if (!id) {
      return NextResponse.json(
        { error: "ID del producto no proporcionado" },
        { status: 400 }
      );
    }

    // Buscar el producto en la base de datos
    const product = await prisma.inventoryItem.findUnique({
      where: { item_id: id },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Eliminar la imagen de S3 si existe
    if (product.item_image_url?.startsWith("https")) {
      const s3Key = product.item_image_url.split("/uploads/")[1];

      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME!,
          Key: `uploads/${s3Key}`,
        })
      );
    }

    // Eliminar el producto de la base de datos
    await prisma.inventoryItem.delete({ where: { item_id: id } });

    return NextResponse.json(
      { message: "Producto eliminado correctamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al eliminar el producto:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Actualizar un producto por ID
export async function PUT(req: NextRequest, context: ContextParams) {
  try {
    const { id } = context.params;

    if (!id) {
      return NextResponse.json(
        { error: "ID del producto no proporcionado" },
        { status: 400 }
      );
    }

    const data = await req.json();
    const { item_name, item_description, item_price, item_discount, item_stock } = data;

    // Validar los datos recibidos
    if (
      !item_name ||
      !item_description ||
      isNaN(parseFloat(item_price)) ||
      isNaN(parseInt(item_stock))
    ) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos y deben ser válidos" },
        { status: 400 }
      );
    }

    // Actualizar el producto en la base de datos
    const updatedProduct = await prisma.inventoryItem.update({
      where: { item_id: id },
      data: {
        item_name,
        item_description,
        item_price: parseFloat(item_price),
        item_discount: parseFloat(item_discount) || 0,
        item_stock: parseInt(item_stock),
      },
    });

    return NextResponse.json(
      { message: "Producto actualizado correctamente", product: updatedProduct },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al actualizar el producto:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
