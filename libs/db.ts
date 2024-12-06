import { PrismaClient } from "@prisma/client";

declare global {
  // Esta variable solo estará disponible en el modo desarrollo.
  var prisma: PrismaClient | undefined;
}

const prisma =
  globalThis.prisma ||
  new PrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

export default prisma;
