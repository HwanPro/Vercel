// src/app/api/products/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { v4 as uuidv4 } from "uuid";

// Obtener todos los productos
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

// Crear un nuevo producto
export async function POST(req: NextRequest) {
  try {
    const { item_name, item_description, item_price, item_discount, item_stock, item_image_url } = await req.json();

    // Validación de campos
    if (!item_name || !item_description || !item_price || !item_stock || !item_image_url) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    // Crear producto en la base de datos
    const newProduct = await prisma.inventoryItem.create({
      data: {
        item_id: uuidv4(),
        item_name,
        item_description,
        item_price: parseFloat(item_price),
        item_discount: parseFloat(item_discount) || 0,
        item_stock: parseInt(item_stock, 10),
        item_image_url,
      },
    });

    return NextResponse.json({ product: newProduct }, { status: 201 });
  } catch (error) {
    console.error("Error al crear el producto:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
