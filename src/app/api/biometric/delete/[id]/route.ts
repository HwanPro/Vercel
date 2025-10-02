// src/app/api/biometric/delete/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";

const BASE = process.env.BIOMETRIC_BASE || "http://127.0.0.1:8002";
export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { ok: false, message: "ID de usuario requerido" },
        { status: 400 }
      );
    }

    // 1. Eliminar de la base de datos
    const deletedFingerprint = await prisma.fingerprint.deleteMany({
      where: { user_id: userId },
    });

    console.log(`[DELETE] Huella eliminada de BD para usuario ${userId}: ${deletedFingerprint.count} registros`);

    // 2. Opcional: También eliminar del dispositivo/servicio Python si es necesario
    // (Por ahora no es necesario ya que el servicio Python lee desde la BD)

    return NextResponse.json({
      ok: true,
      message: `Huella eliminada correctamente (${deletedFingerprint.count} registros)`,
      deletedCount: deletedFingerprint.count,
    });

  } catch (error) {
    console.error("[DELETE] Error eliminando huella:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Error interno del servidor al eliminar huella",
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

