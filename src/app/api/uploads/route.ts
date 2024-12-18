import { NextRequest, NextResponse } from "next/server";
import formidable from "formidable";
import { IncomingMessage } from "http";
import { PassThrough } from "stream";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
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

// Promisify para form.parse
async function parseFormAsync(req: IncomingMessage) {
  return new Promise<{ fields: formidable.Fields; files: formidable.Files }>(
    (resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    }
  );
}

// Configuración de AWS S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  console.log("🛠️ Iniciando el proceso de subida...");
  try {
    // Convertir NextRequest a IncomingMessage
    const incomingMsg = nextRequestToIncomingMessage(req);
    console.log("✅ NextRequest convertido a IncomingMessage.");

    // Parsear el formulario
    const { fields, files } = await parseFormAsync(incomingMsg);
    console.log("✅ Formulario parseado:", files);

    const fileData = files.file;
    if (!fileData) {
      console.error("❌ No se recibió ningún archivo.");
      return NextResponse.json(
        { error: "No se seleccionó ningún archivo" },
        { status: 400 }
      );
    }

    // Preparar el archivo para S3
    const file = Array.isArray(fileData) ? fileData[0] : fileData;
    const fileStream = fs.createReadStream(file.filepath);
    const fileKey = `uploads/${uuidv4()}-${file.originalFilename}`;

    console.log("📤 Subiendo archivo a S3 con clave:", fileKey);

    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: fileKey,
      Body: fileStream,
      ContentType: file.mimetype || "application/octet-stream",
    };

    await s3Client.send(new PutObjectCommand(uploadParams));
    console.log("✅ Archivo subido con éxito a S3.");

    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${fileKey}`;
    return NextResponse.json(
      { message: "Archivo subido con éxito", fileUrl },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error al subir archivo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Configuración de runtime
export const runtime = "nodejs"; // Opcional: Puedes usar "edge" o "nodejs"
