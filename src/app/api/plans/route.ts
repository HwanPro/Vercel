import { NextResponse } from "next/server";
import prisma from "@/libs/prisma";

export async function GET() {
  const plans = await prisma.plan.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(plans);
}

export async function POST(request: Request) {
  const { name, price, description } = await request.json();
  const plan = await prisma.plan.create({
    data: { name, price, description },
  });

  return NextResponse.json(plan, { status: 201 });
}
