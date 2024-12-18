import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import formidable from "formidable";
import { PassThrough } from "stream";
import { IncomingMessage } from "http";
import { Readable } from "stream";

const form = formidable({ multiples: false });

// Función para convertir NextRequest a IncomingMessage
function nextRequestToIncomingMessage(req: NextRequest): IncomingMessage {
  const pass = new PassThrough();
  if (req.body) {
    Readable.fromWeb(req.body as any).pipe(pass);
  }

  const headers: Record<string, string> = {};
  for (const [key, value] of req.headers) {
    headers[key.toLowerCase()] = value;
  }

  const msg = pass as unknown as IncomingMessage;
  msg.headers = headers;
  msg.method = req.method ?? "POST";
  msg.url = req.nextUrl.pathname + (req.nextUrl.search || "");

  return msg;
}

// Configuración del cliente S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    // 1. Obtener el archivo del formData
    const data = await req.formData();
    const file = data.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No se seleccionó ningún archivo" },
        { status: 400 }
      );
    }

    // 2. Convertir el archivo a buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileKey = `uploads/${uuidv4()}-${file.name}`;

    // 3. Subir a S3
    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: fileKey,
      Body: fileBuffer,
      ContentType: file.type || "application/octet-stream",
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

    return NextResponse.json(
      { message: "Archivo subido con éxito", fileUrl },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al subir archivo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export const config = {
  runtime: "nodejs", // Esto asegura que use Node.js runtime y no Edge
  api: {
    bodyParser: false, // Necesario para manejar archivos con formData
  },
};
