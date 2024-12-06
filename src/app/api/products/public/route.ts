// src/app/api/products/public/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/libs/prisma";

// GET - Obtener productos disponibles para los clientes
export async function GET(req: NextRequest) {
  try {
    const products = await prisma.inventoryItem.findMany({
      where: {
        item_stock: {
          gt: 0,
        },
      },
      select: {
        item_id: true,
        item_name: true,
        item_description: true,
        item_price: true,
        item_discount: true,
        item_image_url: true,
        item_stock: true, // Asegúrate de incluir esto
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error al obtener los productos públicos:", error);
    return NextResponse.json(
      { error: "Error al obtener los productos" },
      { status: 500 }
    );
  }
}


// POST - Procesar una compra
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, quantity, customerId } = body;

    if (!productId || !quantity || !customerId) {
      return NextResponse.json(
        { error: "Faltan datos para procesar la compra" },
        { status: 400 }
      );
    }

    // Verificar si el producto existe y tiene stock suficiente
    const product = await prisma.inventoryItem.findUnique({
      where: { item_id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    if (product.item_stock < quantity) {
      return NextResponse.json(
        { error: "Stock insuficiente" },
        { status: 400 }
      );
    }

    // Actualizar el stock del producto
    await prisma.inventoryItem.update({
      where: { item_id: productId },
      data: {
        item_stock: product.item_stock - quantity,
      },
    });

    // Crear el registro de la compra (asumiendo que tienes un modelo Purchase)
    const discount = product.item_discount || 0; // Usa 0 como valor por defecto

    const purchase = await prisma.purchase.create({
      data: {
        purchase_quantity: quantity,
        purchase_total:
          (product.item_price - product.item_price * (discount / 100)) * quantity,
        customer: {
          connect: { id: customerId },
        },
        product: {
          connect: { item_id: productId },
        },
      },
    });
    

    return NextResponse.json({ purchase }, { status: 201 });
  } catch (error) {
    console.error("Error al procesar la compra:", error);
    return NextResponse.json(
      { error: "Error al procesar la compra" },
      { status: 500 }
    );
  }
}
