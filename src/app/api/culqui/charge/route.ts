import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Verifica si la clave de Culqi está configurada
  if (!process.env.CULQI_SECRET_KEY) {
    return NextResponse.json({
      success: false,
      message: "Pasarela de pago deshabilitada temporalmente.",
    });
  }

  try {
    const { token, amount, currency, description, email } = await request.json();

    // Simulación del procesamiento del pago
    const charge = {
      id: "simulated_charge_id",
      amount,
      currency: currency || "PEN",
      description: description || "Pago simulado",
      email,
    };

    return NextResponse.json({ success: true, charge });
  } catch (error: any) {
    console.error("Error creando el cargo:", error);
    return NextResponse.json(
      { success: false, message: "Error procesando el pago." },
      { status: 400 }
    );
  }
}
