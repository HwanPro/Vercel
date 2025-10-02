import { PrismaClient } from '@prisma/client';
import { seedExercises } from './seeds/exercises';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seeds...');
  
  try {
    // Sembrar ejercicios base
    await seedExercises();
    
    console.log('✅ Todos los seeds completados exitosamente');
  } catch (error) {
    console.error('❌ Error durante el seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
