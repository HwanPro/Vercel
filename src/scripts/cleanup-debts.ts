// src/scripts/cleanup-debts.ts
// Script para limpiar deudas diarias automáticamente (ejecutar a medianoche)

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDailyDebts() {
  try {
    console.log('🧹 Iniciando limpieza de deudas diarias...');
    
    // Obtener todas las deudas diarias para mover al historial
    const dailyDebts = await (prisma as any).dailyDebt.findMany();
    
    if (dailyDebts.length === 0) {
      console.log('✅ No hay deudas diarias para limpiar');
      return;
    }

    console.log(`📊 Encontradas ${dailyDebts.length} deudas diarias para procesar`);

    // Mover todas las deudas al historial
    const historyPromises = dailyDebts.map((debt: any) =>
      (prisma as any).debtHistory.create({
        data: {
          clientProfileId: debt.clientProfileId,
          productType: debt.productType,
          productName: debt.productName,
          amount: debt.amount,
          quantity: debt.quantity,
          debtType: 'daily',
          createdAt: debt.createdAt,
          deletedAt: new Date(),
          createdBy: debt.createdBy,
        },
      })
    );

    await Promise.all(historyPromises);
    console.log(`📝 ${dailyDebts.length} deudas movidas al historial`);

    // Eliminar todas las deudas diarias
    const deleteResult = await (prisma as any).dailyDebt.deleteMany({});
    console.log(`🗑️ ${deleteResult.count} deudas diarias eliminadas`);

    console.log('✅ Limpieza de deudas diarias completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error en limpieza de deudas diarias:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function cleanupWeeklyHistory() {
  try {
    console.log('🧹 Iniciando limpieza semanal del historial...');
    
    // Eliminar historial de más de una semana
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const deleteResult = await (prisma as any).debtHistory.deleteMany({
      where: {
        createdAt: {
          lt: oneWeekAgo,
        },
      },
    });

    console.log(`🗑️ ${deleteResult.count} registros de historial eliminados`);
    console.log('✅ Limpieza semanal del historial completada');
    
  } catch (error) {
    console.error('❌ Error en limpieza semanal:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'daily':
      await cleanupDailyDebts();
      break;
    case 'weekly':
      await cleanupWeeklyHistory();
      break;
    case 'both':
      await cleanupDailyDebts();
      await cleanupWeeklyHistory();
      break;
    default:
      console.log('Uso: npm run cleanup-debts [daily|weekly|both]');
      console.log('  daily  - Limpia deudas diarias (ejecutar a medianoche)');
      console.log('  weekly - Limpia historial semanal (ejecutar los domingos)');
      console.log('  both   - Ejecuta ambas limpiezas');
      process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Error ejecutando script:', error);
    process.exit(1);
  });
}

export { cleanupDailyDebts, cleanupWeeklyHistory };
