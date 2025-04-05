// src/infrastructure/whatsapp/whatsappService.ts
import axios from "axios";

export async function sendWhatsAppMessage(phone: string, message: string) {
  // Formatea el número para WhatsApp (e.g., '+51XXXXXXXXX')
  const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;

  try {
    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
      new URLSearchParams({
        Body: message,
        From: "whatsapp:+14155238886", // Este es el número de envío de WhatsApp de Twilio (configúralo según corresponda)
        To: `whatsapp:${formattedPhone}`,
      }),
      {
        auth: {
          username: process.env.TWILIO_ACCOUNT_SID || "",
          password: process.env.TWILIO_AUTH_TOKEN || "",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error enviando WhatsApp:", error);
    throw new Error("Error enviando mensaje de WhatsApp");
  }
}
