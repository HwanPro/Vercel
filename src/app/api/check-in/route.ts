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

  const userId = qrData.split("user=")[1]; // Extrae el ID del usuario del QR

  try {
    await prisma.$connect(); // Asegura que Prisma esté conectado antes de usarlo

    await prisma.attendance.create({
      data: {
        userId,
        checkInTime: new Date(),
      },
    });

    return res.status(200).json({ message: "Asistencia registrada", userId });
  } catch (error) {
    console.error("Error en la API de asistencia:", error);
    return res.status(500).json({ message: "Error al registrar asistencia" });
  }
}
