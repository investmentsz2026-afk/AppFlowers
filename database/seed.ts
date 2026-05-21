import { PrismaClient, Role, ClientStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de la base de datos...');

  // 1. Crear Usuario Admin por defecto
  // Contraseña: admin123
  const adminPasswordHash = '$2b$10$Rfx34PZrzn.06VOS38Jv/O4JR18U8ESDnQYN4XO5on/nsRva9v7i.';
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@apkexcel.com' },
    update: { password: adminPasswordHash },
    create: {
      email: 'admin@apkexcel.com',
      password: adminPasswordHash,
      name: 'Administrador Principal',
      role: Role.ADMIN,
    },
  });
  console.log(`Usuario Admin creado: ${admin.email}`);

  // 2. Crear Sectores
  const sectorA = await prisma.sector.upsert({
    where: { name: 'Sector A' },
    update: {},
    create: {
      name: 'Sector A',
      totalCapacity: 100,
    },
  });

  const sectorB = await prisma.sector.upsert({
    where: { name: 'Sector B' },
    update: {},
    create: {
      name: 'Sector B',
      totalCapacity: 50,
    },
  });

  const sectorC = await prisma.sector.upsert({
    where: { name: 'Sector C' },
    update: {},
    create: {
      name: 'Sector C',
      totalCapacity: 75,
    },
  });
  console.log('Sectores creados: Sector A, Sector B, Sector C');

  // 3. Crear Clientes de Prueba
  const now = new Date();
  
  // Cliente Activo (Vence en 20 días)
  const activeDueDate = new Date();
  activeDueDate.setDate(now.getDate() + 20);
  const activeLastPayment = new Date();
  activeLastPayment.setDate(now.getDate() - 10);

  const client1 = await prisma.client.upsert({
    where: { dni: '12345678' },
    update: {
      contactName: 'Roberto Pérez Ramos',
      flowers: 'Ramo Variado',
      amount: 10.0,
    },
    create: {
      fullName: 'Juan Carlos Pérez Ramos',
      contactName: 'Roberto Pérez Ramos',
      dni: '12345678',
      phone: '+51 987 654 321',
      address: 'N-CF07-02',
      flowers: 'Ramo Variado',
      amount: 10.0,
      remarks: 'Familiar directo de parcela principal. Siempre paga puntual.',
      status: ClientStatus.ACTIVE,
      lastPaymentDate: activeLastPayment,
      nextDueDate: activeDueDate,
      sectorId: sectorA.id,
    },
  });

  // Cliente Próximo a Vencer (Vence en 3 días)
  const pendingDueDate = new Date();
  pendingDueDate.setDate(now.getDate() + 3);
  const pendingLastPayment = new Date();
  pendingLastPayment.setDate(now.getDate() - 27);

  const client2 = await prisma.client.upsert({
    where: { dni: '87654321' },
    update: {
      contactName: 'Sofía Elena Rodríguez Solís',
      flowers: 'Corona Imperial',
      amount: 25.0,
    },
    create: {
      fullName: 'María Elena Rodríguez Solís',
      contactName: 'Sofía Elena Rodríguez Solís',
      dni: '87654321',
      phone: '+51 912 345 678',
      address: 'Jardin 1',
      flowers: 'Corona Imperial',
      amount: 25.0,
      remarks: 'Requiere recordatorio de pago por WhatsApp 5 días antes.',
      status: ClientStatus.PENDING,
      lastPaymentDate: pendingLastPayment,
      nextDueDate: pendingDueDate,
      sectorId: sectorB.id,
    },
  });

  // Cliente Vencido (Venció hace 15 días)
  const expiredDueDate = new Date();
  expiredDueDate.setDate(now.getDate() - 15);
  const expiredLastPayment = new Date();
  expiredLastPayment.setDate(now.getDate() - 45);

  const client3 = await prisma.client.upsert({
    where: { dni: '45678912' },
    update: {
      contactName: 'Pedro Gómez Castro Jr.',
      flowers: 'Rosas Rojas x12',
      amount: 15.0,
    },
    create: {
      fullName: 'Pedro Alfonso Gómez Castro',
      contactName: 'Pedro Gómez Castro Jr.',
      dni: '45678912',
      phone: '+51 934 567 890',
      address: 'Columbario N1',
      flowers: 'Rosas Rojas x12',
      amount: 15.0,
      remarks: 'Número de contacto secundario: +51 922 111 222.',
      status: ClientStatus.EXPIRED,
      lastPaymentDate: expiredLastPayment,
      nextDueDate: expiredDueDate,
      sectorId: sectorC.id,
    },
  });
  console.log('Clientes de prueba creados.');

  // 4. Crear Historiales de Prueba
  await prisma.history.createMany({
    data: [
      {
        userId: admin.id,
        clientId: client1.id,
        action: 'CLIENT_CREATE',
        details: 'Cliente Juan Carlos Pérez Ramos creado en Sector A.',
        createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000 * 10), // hace 10 días
      },
      {
        userId: admin.id,
        clientId: client2.id,
        action: 'CLIENT_CREATE',
        details: 'Cliente María Elena Rodríguez Solís creado en Sector B.',
        createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000 * 5), // hace 5 días
      },
      {
        userId: admin.id,
        clientId: client3.id,
        action: 'CLIENT_CREATE',
        details: 'Cliente Pedro Alfonso Gómez Castro creado en Sector C.',
        createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000 * 2), // hace 2 días
      },
    ],
  });
  console.log('Historial de movimientos inicializado.');

  console.log('Seed completado con éxito.');
}

main()
  .catch((e) => {
    console.error('Error al ejecutar el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
