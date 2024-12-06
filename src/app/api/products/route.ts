// src/app/api/products/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { v4 as uuidv4 } from "uuid";
import { promises as fs } from "fs";
import path from "path";

export async function GET() {
  try {
    const products = await prisma.inventoryItem.findMany();
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error al obtener los productos:", error);
    return NextResponse.json(
      { error: "Error al obtener los productos" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();

    const item_name = data.get("item_name") as string;
    const item_description = data.get("item_description") as string;
    const item_price = parseFloat(data.get("item_price") as string);
    const item_discount = parseFloat(data.get("item_discount") as string) || 0;
    const item_stock = parseInt(data.get("item_stock") as string);
    const file = data.get("file") as File;

    if (
      !item_name ||
      !item_description ||
      isNaN(item_price) ||
      isNaN(item_stock) ||
      !file
    ) {
      return NextResponse.json(
        { error: "Todos los campos son obligatorios" },
        { status: 400 }
      );
    }

    // Guardar la imagen en el sistema de archivos
    const buffer = Buffer.from(await file.arrayBuffer());
    const imageName = `${uuidv4()}-${file.name}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    // Crear el directorio si no existe
    await fs.mkdir(uploadDir, { recursive: true });

    const imagePath = path.join(uploadDir, imageName);
    await fs.writeFile(imagePath, buffer);

    const imageUrl = `/uploads/${imageName}`;

    // Crear el producto en la base de datos
    const newProduct = await prisma.inventoryItem.create({
      data: {
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
      { error: "Error al crear el producto" },
      { status: 500 }
    );
  }
}
