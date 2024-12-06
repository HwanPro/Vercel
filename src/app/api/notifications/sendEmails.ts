// src/app/api/notifications/sendEmails/route.ts

import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer"

export async function POST(req: NextRequest) {
  try {
    const { notifications } = await req.json();

    // Configura el transportador de Nodemailer
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    for (const notification of notifications) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: notification.clientEmail,
        subject: "Notificación de vencimiento de suscripción",
        text: notification.message,
      };

      await transporter.sendMail(mailOptions);
    }

    return NextResponse.json({ message: "Correos enviados con éxito" });
  } catch (error) {
    console.error("Error al enviar correos:", error);
    return NextResponse.json(
      { error: "Error al enviar correos electrónicos" },
      { status: 500 }
    );
  }
}
