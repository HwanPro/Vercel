import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import prisma from "@/infrastructure/prisma/prisma";

type DispatchItemInput = {
  productId: string;
  quantity: number;
};

function startAndEndOfToday() {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  return { startOfDay, endOfDay };
}

export async function GET(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || token.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { startOfDay, endOfDay } = startAndEndOfToday();

    const [summary, sales] = await Promise.all([
      prisma.purchase.aggregate({
        where: {
          purchase_date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        _count: { id: true },
        _sum: {
          purchase_total: true,
          purchase_quantity: true,
        },
      }),
      prisma.purchase.findMany({
        where: {
          purchase_date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        orderBy: { purchase_date: "desc" },
        include: {
          product: {
            select: {
              item_name: true,
            },
          },
          customer: {
            select: {
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      date: startOfDay.toISOString().slice(0, 10),
      totals: {
        salesCount: summary._count.id,
        itemsCount: summary._sum.purchase_quantity ?? 0,
        amount: Number(summary._sum.purchase_total ?? 0),
      },
      sales: sales.map((sale) => ({
        id: sale.id,
        quantity: sale.purchase_quantity,
        total: sale.purchase_total,
        at: sale.purchase_date,
        productName: sale.product?.item_name ?? "Producto",
        customerName:
          `${sale.customer?.firstName ?? ""} ${sale.customer?.lastName ?? ""}`.trim() ||
          sale.customer?.username ||
          "Cliente",
      })),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error obteniendo caja diaria:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || token.role !== "admin" || !token.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const inputItems = Array.isArray(body?.items) ? body.items : [];

    if (inputItems.length === 0) {
      return NextResponse.json(
        { error: "Debe enviar al menos un producto" },
        { status: 400 }
      );
    }

    const items: DispatchItemInput[] = inputItems
      .map((raw: unknown) => {
        const row = raw as { productId?: unknown; quantity?: unknown };
        return {
          productId: String(row?.productId ?? "").trim(),
          quantity: Number(row?.quantity ?? 0),
        };
      })
      .filter(
        (row: DispatchItemInput) =>
          row.productId.length > 0 &&
          Number.isInteger(row.quantity) &&
          row.quantity > 0
      );

    if (items.length === 0) {
      return NextResponse.json(
        { error: "Los items de venta son inválidos" },
        { status: 400 }
      );
    }

    const productIds = [...new Set(items.map((i) => i.productId))];
    const products = await prisma.inventoryItem.findMany({
      where: { item_id: { in: productIds } },
      select: {
        item_id: true,
        item_name: true,
        item_price: true,
        item_discount: true,
        item_stock: true,
      },
    });
    const productMap = new Map(products.map((p) => [p.item_id, p]));

    const grouped = new Map<string, number>();
    for (const item of items) {
      grouped.set(item.productId, (grouped.get(item.productId) ?? 0) + item.quantity);
    }

    const issues: string[] = [];
    for (const [productId, qty] of grouped.entries()) {
      const product = productMap.get(productId);
      if (!product) {
        issues.push(`Producto no encontrado: ${productId}`);
        continue;
      }
      if (product.item_stock < qty) {
        issues.push(
          `${product.item_name}: stock insuficiente (stock ${product.item_stock}, solicitado ${qty})`
        );
      }
    }

    if (issues.length > 0) {
      return NextResponse.json(
        { error: "No se pudo despachar la venta", details: issues },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      let grandTotal = 0;
      let totalItems = 0;
      let rows = 0;

      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) {
          continue;
        }

        const discountPct = product.item_discount ?? 0;
        const unitPrice = product.item_price * (1 - discountPct / 100);
        const lineTotal = unitPrice * item.quantity;

        await tx.inventoryItem.update({
          where: { item_id: item.productId },
          data: {
            item_stock: {
              decrement: item.quantity,
            },
          },
        });

        await tx.purchase.create({
          data: {
            purchase_quantity: item.quantity,
            purchase_total: Number(lineTotal.toFixed(2)),
            customer: {
              connect: { id: token.id as string },
            },
            product: {
              connect: { item_id: item.productId },
            },
          },
        });

        grandTotal += lineTotal;
        totalItems += item.quantity;
        rows += 1;
      }

      return {
        rows,
        totalItems,
        grandTotal: Number(grandTotal.toFixed(2)),
      };
    });

    return NextResponse.json({
      ok: true,
      message: "Venta despachada correctamente",
      result,
    });
  } catch (error) {
    console.error("Error despachando venta en caja diaria:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
