import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    console.log("🔍 Testing exercises API...");
    
    const exercises = await prisma.exercise.findMany({
      where: { isPublished: true },
      take: 5,
      select: {
        id: true,
        name: true,
        primaryMuscle: true,
        equipment: true,
        level: true,
        description: true
      }
    });

    console.log("✅ Found exercises:", exercises.length);
    
    return NextResponse.json({
      success: true,
      count: exercises.length,
      exercises
    });

  } catch (error) {
    console.error("❌ Error in test API:", error);
    return NextResponse.json(
      { 
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
