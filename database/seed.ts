import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de la base de datos (Producción)...');

  // 1. Crear Usuario Admin por defecto si no existe
  // Contraseña: admin123
  const adminPasswordHash = '$2b$10$Rfx34PZrzn.06VOS38Jv/O4JR18U8ESDnQYN4XO5on/nsRva9v7i.';
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@flowers.com' },
    update: { password: adminPasswordHash },
    create: {
      email: 'admin@flowers.com',
      password: adminPasswordHash,
      name: 'Administrador Principal',
      role: Role.ADMIN,
    },
  });
  console.log(`Usuario Admin verificado/creado: ${admin.email}`);
  console.log('Seed completado con éxito. Listo para producción.');
}

main()
  .catch((e) => {
    console.error('Error al ejecutar el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
