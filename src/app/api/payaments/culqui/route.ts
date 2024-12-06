// src/app/api/payments/culqi/route.ts

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    const { token, amount, description } = await req.json();

    const response = await axios.post(
      "https://api.culqi.com/v2/charges",
      {
        amount,
        currency_code: "PEN",
        email: "cliente@example.com", // Puedes obtener el email del cliente
        source_id: token,
        description,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.CULQI_PRIVATE_KEY}`,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error al procesar el pago con Culqi:", error);
    return NextResponse.json(
      { error: "Error al procesar el pago con Culqi" },
      { status: 500 }
    );
  }
}
