// src/app/api/products/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { promises as fs } from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.inventoryItem.findUnique({
      where: { item_id: params.id },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error al obtener el producto:", error);
    return NextResponse.json(
      { error: "Error al obtener el producto" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const {
      item_name,
      item_description,
      item_price,
      item_discount,
      item_stock,
    } = body;

    if (
      !item_name ||
      !item_description ||
      isNaN(item_price) ||
      isNaN(item_stock)
    ) {
      return NextResponse.json(
        { error: "Campos incompletos" },
        { status: 400 }
      );
    }

    const updatedProduct = await prisma.inventoryItem.update({
      where: { item_id: params.id },
      data: {
        item_name,
        item_description,
        item_price,
        item_discount: item_discount || 0,
        item_stock,
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Error al actualizar el producto:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.inventoryItem.findUnique({
      where: { item_id: params.id },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Eliminar la imagen asociada si existe
    if (product.item_image_url) {
      const filePath = path.join(process.cwd(), "public", product.item_image_url);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.warn("No se pudo eliminar la imagen:", err);
      }
    }

    // Eliminar el producto de la base de datos
    await prisma.inventoryItem.delete({
      where: { item_id: params.id },
    });

    return NextResponse.json(
      { message: "Producto eliminado correctamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al eliminar el producto:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al eliminar el producto" },
      { status: 500 }
    );
  }
}
