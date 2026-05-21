import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClientStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. Contar clientes por estado
    const [totalClients, activeClients, pendingClients, expiredClients] = await Promise.all([
      this.prisma.client.count(),
      this.prisma.client.count({ where: { status: ClientStatus.ACTIVE } }),
      this.prisma.client.count({ where: { status: ClientStatus.PENDING } }),
      this.prisma.client.count({ where: { status: ClientStatus.EXPIRED } }),
    ]);

    // 2. Calcular recaudación total e ingresos del mes actual
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const [paymentsAll, paymentsMonth] = await Promise.all([
      this.prisma.payment.aggregate({
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          paymentDate: {
            gte: startOfMonth,
          },
        },
        _sum: { amount: true },
      }),
    ]);

    const totalRevenue = paymentsAll._sum.amount || 0;
    const monthlyRevenue = paymentsMonth._sum.amount || 0;

    // 3. Obtener actividad reciente (últimos 5 logs de auditoría)
    const recentActivity = await this.prisma.history.findMany({
      include: {
        user: { select: { name: true, role: true } },
        client: { select: { fullName: true, dni: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // 4. Obtener próximos vencimientos (clientes PENDING ordenados por fecha de vencimiento más cercana)
    const upcomingExpirations = await this.prisma.client.findMany({
      where: {
        status: ClientStatus.PENDING,
        nextDueDate: {
          gte: today,
        },
      },
      include: {
        sector: { select: { name: true } },
      },
      orderBy: { nextDueDate: 'asc' },
      take: 5,
    });

    return {
      clients: {
        total: totalClients,
        active: activeClients,
        pending: pendingClients,
        expired: expiredClients,
      },
      revenue: {
        total: totalRevenue,
        monthly: monthlyRevenue,
      },
      recentActivity,
      upcomingExpirations,
    };
  }
}
