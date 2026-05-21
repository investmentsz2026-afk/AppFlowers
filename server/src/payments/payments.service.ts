import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ClientStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(createPaymentDto: CreatePaymentDto, userId: string) {
    const { clientId, amount, paymentMethod, monthsToRenew = 1, dueDateFrom, dueDateTo, remarks } = createPaymentDto;

    // 1. Validar existencia del cliente
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException('El cliente solicitado no existe.');
    }

    let finalDueDateFrom: Date;
    let finalDueDateTo: Date;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 2. Determinar fechas de cobertura
    if (dueDateFrom && dueDateTo) {
      finalDueDateFrom = new Date(dueDateFrom);
      finalDueDateTo = new Date(dueDateTo);

      if (finalDueDateTo <= finalDueDateFrom) {
        throw new BadRequestException('La fecha de fin de cobertura debe ser posterior a la fecha de inicio.');
      }
    } else {
      // Cálculo automático por meses
      // Si el cliente tiene un vencimiento vigente en el futuro, iniciamos desde ahí
      if (client.nextDueDate && client.nextDueDate > today) {
        finalDueDateFrom = new Date(client.nextDueDate);
      } else {
        // Si está vencido o no tiene vencimiento, inicia hoy
        finalDueDateFrom = today;
      }

      // Sumar meses
      finalDueDateTo = new Date(finalDueDateFrom);
      finalDueDateTo.setMonth(finalDueDateTo.getMonth() + monthsToRenew);
    }

    // 3. Registrar el Pago y actualizar el Cliente en una transacción secuencial
    const payment = await this.prisma.$transaction(async (tx) => {
      // A. Crear el pago
      const newPayment = await tx.payment.create({
        data: {
          clientId,
          amount,
          paymentMethod,
          dueDateFrom: finalDueDateFrom,
          dueDateTo: finalDueDateTo,
          remarks,
        },
      });

      // B. Determinar nuevo estado del cliente según el nuevo vencimiento
      // Helper embebido para la transacción
      const computeNewStatus = (dueDate: Date): ClientStatus => {
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return ClientStatus.EXPIRED;
        if (diffDays <= 7) return ClientStatus.PENDING;
        return ClientStatus.ACTIVE;
      };

      const newStatus = computeNewStatus(finalDueDateTo);

      // C. Actualizar datos en Cliente
      await tx.client.update({
        where: { id: clientId },
        data: {
          lastPaymentDate: today,
          nextDueDate: finalDueDateTo,
          status: newStatus,
        },
      });

      // D. Registrar acción de pago en Historial
      await tx.history.create({
        data: {
          userId,
          clientId,
          action: 'PAYMENT_ADD',
          details: `Pago registrado: S/. ${amount.toFixed(2)} (${paymentMethod}). Cobertura del ${finalDueDateFrom.toLocaleDateString()} al ${finalDueDateTo.toLocaleDateString()}. Estado del cliente actualizado a ${newStatus}.`,
        },
      });

      return newPayment;
    });

    return payment;
  }

  async findAll() {
    return this.prisma.payment.findMany({
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            dni: true,
            phone: true,
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async findByClient(clientId: string) {
    return this.prisma.payment.findMany({
      where: { clientId },
      orderBy: { paymentDate: 'desc' },
    });
  }
}
