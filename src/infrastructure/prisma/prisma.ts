import { PrismaClient } from "@prisma/client";

// Definir prisma en `globalThis` de forma segura
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Reutilizar prisma si ya está definido, o crear una nueva instancia
const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
