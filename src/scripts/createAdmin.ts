// src/scripts/createAdmin.ts

import prisma from '@/libs/prisma';
import bcrypt from 'bcrypt';

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('tu_contraseña_segura', 10);

    const admin = await prisma.user.create({
      data: {
        name: 'Administrador',
        email: 'admin@tuapp.com',
        password: hashedPassword,
        role: 'admin',
        emailVerified: true,
      },
    });

    console.log('Administrador creado:', admin);
  } catch (error) {
    console.error('Error al crear el administrador:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
