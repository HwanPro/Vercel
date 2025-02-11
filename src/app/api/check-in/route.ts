import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/libs/prisma"; // Conexión a la base de datos

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { qrData } = req.body;
  if (!qrData) {
    return res.status(400).json({ message: "QR inválido" });
  }

  // Verificar que el usuario extraído del QR es válido
  const userId = qrData.split("user=")[1]; 
  if (!userId) {
    return res.status(400).json({ message: "Usuario no válido en el QR" });
  }

  try {
    await prisma.$connect(); // Asegurar conexión con la base de datos

    // Verificar si el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Registrar la asistencia en la base de datos
    const attendance = await prisma.attendance.create({
      data: {
        userId: userId,
        checkInTime: new Date(),
      },
    });

    return res.status(200).json({ message: "Asistencia registrada", attendance });
  } catch (error) {
    console.error("Error en la API de asistencia:", error);
    return res.status(500).json({ message: "Error al registrar asistencia" });
  } finally {
    await prisma.$disconnect(); // Desconectar Prisma después de la operación
  }
}
