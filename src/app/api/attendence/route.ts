import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/libs/prisma"; // Conexión a la base de datos

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const attendances = await prisma.attendance.findMany({
        orderBy: { checkInTime: "desc" },
      });
      return res.status(200).json(attendances);
    } catch (error) {
      console.error("Error obteniendo lista de asistencia:", error);
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  }

  if (req.method === "POST") {
    try {
      await prisma.attendance.create({
        data: {
          userId: "Gym-QR-Entry", // Asigna un ID genérico
          checkInTime: new Date(),
        },
      });

      return res.status(201).json({ message: "Asistencia registrada" });
    } catch (error) {
      console.error("Error registrando asistencia:", error);
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  }

  return res.status(405).json({ message: "Método no permitido" });
}
