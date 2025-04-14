// prisma/seed.ts (versión CommonJS)
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.plan.createMany({
    data: [
      {
        slug: "plan-mensual",
        name: "Plan Mensual",
        price: 60,
        description: "Acceso ilimitado al gimnasio - Por mes"
      },
      {
        slug: "plan-basico",
        name: "Plan Básico",
        price: 100,
        description: "Para pareja y con descuento en productos"
      },
      {
        slug: "plan-pro",
        name: "Plan Pro",
        price: 150,
        description: "Entrenamiento personalizado - Por 3 meses"
      },
      {
        slug: "plan-elite",
        name: "Plan Elite",
        price: 350,
        description: "Acceso ilimitado y entrenamiento personalizado - Por año"
      }
    ],
    skipDuplicates: true
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
