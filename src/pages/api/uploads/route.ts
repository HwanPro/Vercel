import { NextRequest, NextResponse } from "next/server";
import formidable from "formidable";
import { Readable } from 'node:stream';
import { PassThrough } from "stream";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import { IncomingMessage } from "http";


const form = formidable({ multiples: false });

// Función para crear un IncomingMessage a partir de un NextRequest
function nextRequestToIncomingMessage(req: NextRequest): IncomingMessage {
  const pass = new PassThrough();

  // Convertir el ReadableStream web en un Readable de Node.js
  if (req.body) {
    Readable.fromWeb(req.body as any).pipe(pass);
  }
    
  // Convertir las cabeceras del NextRequest a un objeto de Node
  const headers: Record<string, string> = {};
  for (const [key, value] of req.headers) {
    headers[key.toLowerCase()] = value;
  }

  // Crear un objeto que se parezca a un IncomingMessage
  // Asignamos propiedades esperadas por formidable
  const msg = pass as unknown as IncomingMessage;
  msg.headers = headers;
  msg.method = req.method ?? 'GET';
  // URL completa
  msg.url = req.nextUrl.pathname + (req.nextUrl.search || "");

  return msg;
}

// Funcion promisificada para parsear el formulario
function parseFormAsync(req: IncomingMessage): Promise<[formidable.Fields, formidable.Files]> {
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve([fields, files]);
    });
  });
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
  try {
    // Convertir NextRequest a IncomingMessage para formidable
    const incomingMsg = nextRequestToIncomingMessage(req);

    const [_fields, files] = await parseFormAsync(incomingMsg);

    const fileData = files.file;
    if (!fileData) {
      return NextResponse.json(
        { error: "No se seleccionó ningún archivo" },
        { status: 400 }
      );
    }

    const file = Array.isArray(fileData) ? fileData[0] : fileData;
    if (!file.filepath) {
      return NextResponse.json({ error: "No se encontró el filepath" }, { status: 500 });
    }

    const fileStream = fs.createReadStream(file.filepath);
    const fileKey = `uploads/${uuidv4()}-${file.originalFilename}`;

    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: fileKey,
      Body: fileStream,
      ContentType: file.mimetype || "application/octet-stream",
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${fileKey}`;
    return NextResponse.json({ message: "Archivo subido con éxito", fileUrl }, { status: 200 });
  } catch (error) {
    console.error("Error al subir archivo:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
