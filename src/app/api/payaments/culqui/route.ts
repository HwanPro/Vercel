import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    // 1. Lee el body desde el request
    const { token, amount, email, description } = await req.json();

    // 2. Usa las variables que acabas de extraer
    const response = await axios.post(
      "https://api.culqi.com/v2/charges",
      {
        amount,
        currency_code: "PEN",
        email,
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

    // 3. Retorna la respuesta al cliente
    return NextResponse.json(response.data);
  } catch (error: Error | unknown) {
    console.error("Error en el pago:", (error instanceof axios.AxiosError) ? error.response?.data : (error instanceof Error ? error.message : String(error)));
    return NextResponse.json(
      { error: "Error al procesar el pago", details: (error instanceof axios.AxiosError) ? error.response?.data : undefined },
      { status: 500 }
    );
  }
}
