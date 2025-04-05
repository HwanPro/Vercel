// src/app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/infrastructure/prisma/prisma";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

// AWS S3 configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// GET: Retrieve products
export async function GET() {
  try {
    const products = await prisma.inventoryItem.findMany();
    return NextResponse.json(products, { status: 200 });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// POST: Create a new product
export async function POST(req: NextRequest) {
  console.log("Request received at /api/products");
  try {
    const data = await req.formData();

    // Extract fields
    const item_name = data.get("item_name") as string;
    const item_description = data.get("item_description") as string;
    const item_price = parseFloat(data.get("item_price") as string);
    const item_discount = parseFloat(data.get("item_discount") as string) || 0;
    const item_stock = parseInt(data.get("item_stock") as string, 10);
    const file = data.get("file");

    // Validate fields
    if (!item_name || !item_description || isNaN(item_price) || isNaN(item_stock)) {
      return NextResponse.json(
        { error: "Missing or invalid required fields" },
        { status: 400 }
      );
    }

    // Validate file
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Invalid file" }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const uniqueFileName = `${uuidv4()}-${file.name}`;

    // S3 Upload parameters
    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: `uploads/${uniqueFileName}`,
      Body: buffer,
      ContentType: file.type,
    };

    // Upload to S3
    await s3Client.send(new PutObjectCommand(uploadParams));

    // Public URL of the uploaded file
    const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/uploads/${uniqueFileName}`;

    // Save product in the database
    const newProduct = await prisma.inventoryItem.create({
      data: {
        item_name,
        item_description,
        item_price,
        item_discount,
        item_stock,
        item_image_url: imageUrl,
      },
    });

    return NextResponse.json({
      message: "Product created successfully",
      product: newProduct,
    });
  } catch (error) {
    console.error("Error uploading to S3 or saving to DB:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Set the runtime if you need Node.js APIs
export const runtime = "nodejs";

// Remove the `export const config` entirely.
// No need for bodyParser or other config properties in App Router routes.
