import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

// Configuración de AWS S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();

    // Obtener campos
    const item_name = data.get("item_name") as string;
    const item_description = data.get("item_description") as string;
    const item_price = parseFloat(data.get("item_price") as string);
    const item_discount = parseFloat(data.get("item_discount") as string) || 0;
    const item_stock = parseInt(data.get("item_stock") as string, 10);
    const file = data.get("file");

    // Validación del archivo
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Archivo no válido" }, { status: 400 });
    }

    // Convertir el archivo a buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const uniqueFileName = `${uuidv4()}-${file.name}`;

    // Parámetros de subida a S3
    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: `uploads/${uniqueFileName}`,
      Body: buffer,
      ContentType: file.type,
    };

    // Subir a S3
    await s3Client.send(new PutObjectCommand(uploadParams));

    // URL pública del archivo
    const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/uploads/${uniqueFileName}`;

    // Guardar en la base de datos (o devolver directamente)
    return NextResponse.json({
      message: "Archivo subido con éxito",
      fileUrl: imageUrl,
    });
  } catch (error) {
    console.error("Error al subir a S3:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
export const config = {
  api: { bodyParser: false },
};
