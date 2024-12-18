import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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
    const file = data.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Archivo no válido o no proporcionado" },
        { status: 400 }
      );
    }

    // Preparar buffer para S3
    const buffer = Buffer.from(await file.arrayBuffer());
    const uniqueFileName = `${uuidv4()}-${file.name}`;

    // Subir a AWS S3
    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: `uploads/${uniqueFileName}`,
      Body: buffer,
      ContentType: file.type,
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    // URL pública del archivo
    const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/uploads/${uniqueFileName}`;

    // Aquí puedes devolver la URL directamente o guardarla en la base de datos
    return NextResponse.json(
      { message: "Archivo subido con éxito", fileUrl: imageUrl },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al subir el archivo a S3:", error);
    return NextResponse.json(
      { error: "Error al subir el archivo" },
      { status: 500 }
    );
  }
}
