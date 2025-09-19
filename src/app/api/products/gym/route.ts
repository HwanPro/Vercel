//src/app/api/products/gym/route.ts
import { NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";

export const dynamic = "force-dynamic";

// GET - Obtener productos solo para gimnasio
export async function GET() {
  try {
    // Por ahora, simular productos de gimnasio usando productos existentes
    // que contengan palabras clave relacionadas con gimnasio
    const allProducts = await prisma.inventoryItem.findMany({
      orderBy: [
        { item_name: 'asc' }
      ]
    });

    // Filtrar productos que parezcan ser de gimnasio por nombre
    const gymKeywords = ['agua', 'proteina', 'protein', 'pre', 'entreno', 'workout', 'suplemento', 'bcaa', 'nutrition', 'whey', 'creatina', 'aminoacido'];
    const gymProducts = allProducts.filter(product => 
      gymKeywords.some(keyword => 
        product.item_name.toLowerCase().includes(keyword) ||
        product.item_description.toLowerCase().includes(keyword)
      )
    );

    // Si hay pocos productos de gimnasio, incluir más productos para tener variedad
    let finalProducts = gymProducts;
    if (gymProducts.length < 5) {
      // Agregar productos adicionales que no sean claramente no-gimnasio
      const additionalProducts = allProducts.filter(product => 
        !gymProducts.includes(product) && 
        !product.item_name.toLowerCase().includes('ropa') &&
        !product.item_name.toLowerCase().includes('accesorio') &&
        !product.item_name.toLowerCase().includes('libro')
      ).slice(0, 10 - gymProducts.length);
      
      finalProducts = [...gymProducts, ...additionalProducts];
    }

    // Si aún no hay productos, devolver todos
    if (finalProducts.length === 0) {
      finalProducts = allProducts.slice(0, 10);
    }

    // Agregar categoría simulada basada en el nombre
    const productsWithCategory = finalProducts.map(product => ({
      ...product,
      category: product.item_name.toLowerCase().includes('agua') ? 'agua' :
                product.item_name.toLowerCase().includes('protein') ? 'proteina' :
                product.item_name.toLowerCase().includes('pre') ? 'pre-entreno' : 'otros'
    }));

    return NextResponse.json(productsWithCategory, { status: 200 });
  } catch (error) {
    console.error("Error al obtener productos de gimnasio:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
