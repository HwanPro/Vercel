// src/app/api/products/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { promises as fs } from "fs";
import path from "path";

// Tipo para el contexto que incluye `params`
type ContextParams = {
  params: Promise<{
    id: string;
  }>;
};

// Eliminar producto por ID
export async function DELETE(
  req: NextRequest,
  context: ContextParams
) {
  try {
    // Esperar a que `params` esté disponible
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "ID del producto no proporcionado" },
        { status: 400 }
      );
    }

    // Verificar si el producto existe
    const product = await prisma.inventoryItem.findUnique({
      where: { item_id: id },
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
      where: { item_id: id },
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

// Actualizar un producto por ID
export async function PUT(
  req: NextRequest,
  context: ContextParams
) {
  try {
    // Esperar a que `params` esté disponible
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "ID del producto no proporcionado" },
        { status: 400 }
      );
    }

    const data = await req.json();
    const { item_name, item_description, item_price, item_discount, item_stock } = data;

    // Validar los datos
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
      { error: "Error interno del servidor al actualizar el producto" },
      { status: 500 }
    );
  }
}
