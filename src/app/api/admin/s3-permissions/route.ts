import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutBucketPolicyCommand, GetBucketPolicyCommand } from "@aws-sdk/client-s3";
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
    const command = new GetBucketPolicyCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
    });

    const response = await s3Client.send(command);
    const policy = JSON.parse(response.Policy || "{}");

    return NextResponse.json({
      success: true,
      policy,
      bucketName: process.env.AWS_BUCKET_NAME,
    });
  } catch (error) {
    console.error("Error obteniendo política del bucket:", error);
    return NextResponse.json({
      success: false,
      error: "No se pudo obtener la política del bucket",
      details: error instanceof Error ? error.message : "Error desconocido",
    });
  }
}

export async function POST(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || token.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { action } = await request.json();
    const bucketName = process.env.AWS_BUCKET_NAME!;

    if (action === "make-public") {
      // Política para hacer público el bucket
      const publicPolicy = {
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "PublicReadGetObject",
            Effect: "Allow",
            Principal: "*",
            Action: "s3:GetObject",
            Resource: `arn:aws:s3:::${bucketName}/*`,
          },
        ],
      };

      const command = new PutBucketPolicyCommand({
        Bucket: bucketName,
        Policy: JSON.stringify(publicPolicy),
      });

      await s3Client.send(command);

      return NextResponse.json({
        success: true,
        message: "Bucket configurado como público para lectura",
        policy: publicPolicy,
      });
    }

    if (action === "make-private") {
      // Eliminar política pública
      const command = new PutBucketPolicyCommand({
        Bucket: bucketName,
        Policy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [],
        }),
      });

      await s3Client.send(command);

      return NextResponse.json({
        success: true,
        message: "Bucket configurado como privado",
      });
    }

    return NextResponse.json(
      { error: "Acción no válida" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error configurando permisos del bucket:", error);
    return NextResponse.json(
      { 
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
