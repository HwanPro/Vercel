import { NextRequest, NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getToken } from "next-auth/jwt";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function GET(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || token.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_BUCKET_NAME!,
      MaxKeys: 1000, // Ajustar según necesidad
    });

    const response = await s3Client.send(command);
    const bucketUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;

    // Procesar imágenes
    const images = await Promise.all((response.Contents || []).map(async (object) => {
      const key = object.Key || "";
      const folder = key.includes("/") ? key.split("/")[0] : "root";
      
      // Intentar generar URL firmada para imágenes privadas
      let imageUrl = `${bucketUrl}/${key}`;
      
      try {
        // Verificar si la imagen es accesible públicamente
        const testResponse = await fetch(imageUrl, { method: "HEAD" });
        if (!testResponse.ok) {
          // Si no es accesible, generar URL firmada
          const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME!,
            Key: key,
          });
          imageUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        }
      } catch (error) {
        // Si hay error, usar URL firmada como respaldo
        try {
          const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME!,
            Key: key,
          });
          imageUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        } catch (signedError) {
          console.error(`Error generando URL firmada para ${key}:`, signedError);
        }
      }
      
      return {
        key,
        url: imageUrl,
        size: object.Size || 0,
        lastModified: object.LastModified?.toISOString() || new Date().toISOString(),
        folder,
      };
    }));

    // Calcular estadísticas por carpeta
    const folderStats = images.reduce((acc, image) => {
      const folderName = image.folder;
      if (!acc[folderName]) {
        acc[folderName] = { name: folderName, count: 0, totalSize: 0 };
      }
      acc[folderName].count += 1;
      acc[folderName].totalSize += image.size;
      return acc;
    }, {} as Record<string, { name: string; count: number; totalSize: number }>);

    const folders = Object.values(folderStats);

    return NextResponse.json({
      images,
      folders,
      totalImages: images.length,
      totalSize: images.reduce((sum, img) => sum + img.size, 0),
    });
  } catch (error) {
    console.error("Error listando imágenes S3:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || token.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { key } = await request.json();

    if (!key) {
      return NextResponse.json(
        { error: "Clave de objeto requerida" },
        { status: 400 }
      );
    }

    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
    });

    await s3Client.send(command);

    return NextResponse.json({
      success: true,
      message: "Imagen eliminada correctamente",
    });
  } catch (error) {
    console.error("Error eliminando imagen S3:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
