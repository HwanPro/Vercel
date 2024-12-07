import prisma from "@/libs/prisma";
 // Ajusta la ruta según corresponda

async function testConnection() {
  try {
    const users = await prisma.user.findMany();
    console.log("Usuarios encontrados:", users);
  } catch (error) {
    console.error("Error al conectar con la base de datos:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
