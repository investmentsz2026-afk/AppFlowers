import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientStatus, Client } from '@prisma/client';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  // Función helper para calcular el estado real del cliente según la fecha de vencimiento
  computeStatus(nextDueDate: Date | null): ClientStatus {
    if (!nextDueDate) return ClientStatus.ACTIVE;
    
    const now = new Date();
    // Normalizar fechas para comparar sólo año, mes y día
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDate = new Date(nextDueDate.getFullYear(), nextDueDate.getMonth(), nextDueDate.getDate());
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return ClientStatus.EXPIRED; // Vencido
    } else if (diffDays <= 7) {
      return ClientStatus.PENDING; // Próximo a vencer (menos o igual a 7 días)
    } else {
      return ClientStatus.ACTIVE; // Activo
    }
  }

  // Verifica y actualiza el estado en BD si es necesario para mantener consistencia 100% en tiempo real
  async syncStatus(client: Client): Promise<Client> {
    const computed = this.computeStatus(client.nextDueDate);
    if (client.status !== computed) {
      return this.prisma.client.update({
        where: { id: client.id },
        data: { status: computed },
      });
    }
    return client;
  }

  async create(createClientDto: CreateClientDto, userId: string) {
    const { sectorId, dni, lastPaymentDate, nextDueDate, ...rest } = createClientDto;

    // 1. Validar DNI único
    const existing = await this.prisma.client.findUnique({
      where: { dni },
    });
    if (existing) {
      throw new BadRequestException(`Ya existe un cliente registrado con el DNI '${dni}'.`);
    }

    // 2. Validar capacidad del sector (si se proporciona)
    let targetSectorName = 'Sin Sector';
    if (sectorId) {
      const sector = await this.prisma.sector.findUnique({
        where: { id: sectorId },
        include: {
          _count: { select: { clients: true } },
        },
      });

      if (!sector) {
        throw new NotFoundException('El sector seleccionado no existe.');
      }

      if (sector._count.clients >= sector.totalCapacity) {
        throw new BadRequestException(
          `El '${sector.name}' se encuentra lleno (capacidad: ${sector.totalCapacity}/${sector.totalCapacity}). Por favor, elija otro sector.`,
        );
      }
      targetSectorName = sector.name;
    }

    // 3. Formatear fechas y calcular estado
    const parsedLastPayment = lastPaymentDate ? new Date(lastPaymentDate) : null;
    const parsedNextDue = nextDueDate ? new Date(nextDueDate) : null;
    const status = this.computeStatus(parsedNextDue);
    const parsedAmount = rest.amount ? parseFloat(rest.amount.toString()) : 0.0;

    // 4. Crear cliente
    const client = await this.prisma.client.create({
      data: {
        ...rest,
        amount: parsedAmount,
        dni,
        sectorId: sectorId || null,
        lastPaymentDate: parsedLastPayment,
        nextDueDate: parsedNextDue,
        status,
      },
    });

    // 5. Registrar en Historial
    await this.prisma.history.create({
      data: {
        userId,
        clientId: client.id,
        action: 'CLIENT_CREATE',
        details: `Se registró al cliente ${client.fullName} (DNI: ${client.dni})` + (sectorId ? ` en el ${targetSectorName}.` : '.'),
      },
    });

    return client;
  }

  async findAll(params: {
    search?: string;
    status?: ClientStatus;
    sectorId?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, status, sectorId, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    // Construcción dinámica de filtros Prisma
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (sectorId) {
      where.sectorId = sectorId;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { dni: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { sector: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Primero obtenemos los clientes
    const rawClients = await this.prisma.client.findMany({
      where,
      include: {
        sector: {
          select: { id: true, name: true },
        },
      },
      orderBy: { fullName: 'asc' },
      skip,
      take: limit,
    });

    // Sincronizamos en caliente el estado de cada cliente de la página actual para
    // asegurar visualización 100% veraz e ingresos actualizados
    const clients = await Promise.all(
      rawClients.map(async (c) => {
        const synced = await this.syncStatus(c);
        return {
          ...synced,
          sector: c.sector,
        };
      }),
    );

    const total = await this.prisma.client.count({ where });

    return {
      data: clients,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        sector: {
          select: { id: true, name: true },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        histories: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('El cliente solicitado no existe.');
    }

    // Sincronizar estado en caliente al consultar detalle individual
    const synced = await this.syncStatus(client);
    
    return {
      ...synced,
      sector: client.sector,
      payments: client.payments,
      histories: client.histories,
    };
  }

  async update(id: string, updateClientDto: UpdateClientDto, userId: string) {
    const existingClient = await this.prisma.client.findUnique({
      where: { id },
      include: { sector: true },
    });

    if (!existingClient) {
      throw new NotFoundException('El cliente solicitado no existe.');
    }

    const { sectorId, dni, lastPaymentDate, nextDueDate, ...rest } = updateClientDto;

    // 1. Validar DNI único
    if (dni && dni !== existingClient.dni) {
      const duplicate = await this.prisma.client.findUnique({
        where: { dni },
      });
      if (duplicate) {
        throw new BadRequestException(`Ya existe otro cliente con el DNI '${dni}'.`);
      }
    }

    // 2. Validar capacidad si cambia de sector
    let targetSectorName = existingClient.sector?.name || 'Sin Sector';
    if (sectorId !== undefined && sectorId !== existingClient.sectorId) {
      if (sectorId) {
        const sector = await this.prisma.sector.findUnique({
          where: { id: sectorId },
          include: { _count: { select: { clients: true } } },
        });

        if (!sector) {
          throw new NotFoundException('El sector destino no existe.');
        }

        if (sector._count.clients >= sector.totalCapacity) {
          throw new BadRequestException(
            `No se puede trasladar al cliente. El '${sector.name}' ya alcanzó su capacidad límite (${sector.totalCapacity}/${sector.totalCapacity}).`,
          );
        }
        targetSectorName = sector.name;
      }
    }

    // 3. Formatear fechas y calcular estado
    const dataToUpdate: any = { ...rest };
    if (rest.amount !== undefined) {
      dataToUpdate.amount = rest.amount ? parseFloat(rest.amount.toString()) : 0.0;
    }
    if (dni) dataToUpdate.dni = dni;
    if (sectorId !== undefined) dataToUpdate.sectorId = sectorId || null;
    if (lastPaymentDate !== undefined) dataToUpdate.lastPaymentDate = lastPaymentDate ? new Date(lastPaymentDate) : null;
    if (nextDueDate !== undefined) {
      const parsedNextDue = nextDueDate ? new Date(nextDueDate) : null;
      dataToUpdate.nextDueDate = parsedNextDue;
      dataToUpdate.status = this.computeStatus(parsedNextDue);
    } else if (nextDueDate === undefined && lastPaymentDate !== undefined) {
      // Si cambia el último pago pero no el vencimiento, re-calculamos por seguridad
      dataToUpdate.status = this.computeStatus(existingClient.nextDueDate);
    }

    // 4. Actualizar
    const updatedClient = await this.prisma.client.update({
      where: { id },
      data: dataToUpdate,
    });

    // 5. Historial de Cambios
    const changes: string[] = [];
    if (rest.fullName && rest.fullName !== existingClient.fullName) changes.push(`nombre: '${existingClient.fullName}' a '${rest.fullName}'`);
    if (dni && dni !== existingClient.dni) changes.push(`DNI: '${existingClient.dni}' a '${dni}'`);
    if (sectorId && sectorId !== existingClient.sectorId) changes.push(`sector: trasladado al ${targetSectorName}`);
    if (nextDueDate && nextDueDate !== existingClient.nextDueDate?.toISOString()) changes.push(`vencimiento: del ${existingClient.nextDueDate?.toLocaleDateString() || 'N/A'} al ${new Date(nextDueDate).toLocaleDateString()}`);

    const details = changes.length > 0 
      ? `Se actualizaron los datos del cliente ${updatedClient.fullName}. Cambios: ${changes.join(', ')}.`
      : `Se modificaron observaciones/datos de contacto del cliente ${updatedClient.fullName}.`;

    await this.prisma.history.create({
      data: {
        userId,
        clientId: updatedClient.id,
        action: 'CLIENT_UPDATE',
        details,
      },
    });

    return updatedClient;
  }

  async remove(id: string, userId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: { sector: true },
    });

    if (!client) {
      throw new NotFoundException('El cliente solicitado no existe.');
    }

    // Para evitar perder el log de auditoría al borrar en cascada (Cascade),
    // primero insertamos un historial huérfano (clientId: null) que describa detalladamente la eliminación.
    const sectorNameLog = client.sector?.name ? ` del ${client.sector.name}` : '';
    await this.prisma.history.create({
      data: {
        userId,
        clientId: null,
        action: 'CLIENT_DELETE',
        details: `Se eliminó definitivamente al cliente ${client.fullName} (DNI: ${client.dni})${sectorNameLog}.`,
      },
    });

    return this.prisma.client.delete({
      where: { id },
    });
  }

  // Tarea global para actualizar estados por lote (e.g. ejecutado por cron o dashboard general)
  async syncAllClientStatuses(): Promise<number> {
    const clients = await this.prisma.client.findMany();
    let count = 0;
    
    for (const client of clients) {
      const computed = this.computeStatus(client.nextDueDate);
      if (client.status !== computed) {
        await this.prisma.client.update({
          where: { id: client.id },
          data: { status: computed },
        });
        count++;
      }
    }
    return count;
  }

  // Importación masiva de clientes desde Excel/CSV
  async bulkCreate(clientsData: any[], userId: string) {
    const results = {
      successCount: 0,
      failedCount: 0,
      errors: [] as { row: number; client: string; reason: string }[],
    };

    // Cargar sectores existentes para acelerar en memoria
    const sectors = await this.prisma.sector.findMany({
      include: { _count: { select: { clients: true } } },
    });
    const sectorMapByName = new Map(sectors.map((s) => [s.name.toLowerCase().trim(), s]));
    const sectorCountMap = new Map(sectors.map((s) => [s.id, s._count.clients]));

    // Cargar DNIs existentes en la base de datos
    const existingClients = await this.prisma.client.findMany({ select: { dni: true } });
    const existingDnis = new Set(existingClients.map((c) => c.dni.trim()));

    for (let i = 0; i < clientsData.length; i++) {
      const data = clientsData[i];
      const rowNum = i + 1;
      const clientIdentifier = data.fullName || `Fila ${rowNum}`;

      try {
        const fullName = data.fullName?.toString().trim();
        const dni = data.dni?.toString().trim();

        if (!fullName) {
          throw new Error('El nombre completo es obligatorio');
        }
        if (!dni) {
          throw new Error('El DNI es obligatorio');
        }
        if (existingDnis.has(dni)) {
          throw new Error(`Ya existe un cliente registrado con el DNI '${dni}'.`);
        }

        // Resolver o crear sector automáticamente si se proporciona sectorName
        let resolvedSectorId: string | null = null;
        const sectorName = data.sectorName?.toString().trim();
        
        if (sectorName) {
          const key = sectorName.toLowerCase();
          let sector = sectorMapByName.get(key);

          if (!sector) {
            // Crear el sector automáticamente con capacidad de 100
            sector = (await this.prisma.sector.create({
              data: {
                name: sectorName,
                totalCapacity: 100,
              },
            })) as any;
            (sector as any)._count = { clients: 0 };
            sectorMapByName.set(key, sector!);
            sectorCountMap.set(sector!.id, 0);
          }

          const currentClientsCount = sectorCountMap.get(sector!.id) || 0;
          if (currentClientsCount >= sector!.totalCapacity) {
            throw new Error(`El '${sectorName}' se encuentra lleno (capacidad: ${sector!.totalCapacity}).`);
          }

          resolvedSectorId = sector!.id;
          sectorCountMap.set(sector!.id, currentClientsCount + 1);
        } else if (data.sectorId?.toString().trim()) {
          // Si envían directamente un sectorId en el JSON
          resolvedSectorId = data.sectorId.toString().trim();
        }

        // Validar e inyectar fechas si existen (se aceptan nulas)
        const parsedLastPayment = data.lastPaymentDate ? new Date(data.lastPaymentDate) : null;
        const parsedNextDue = data.nextDueDate ? new Date(data.nextDueDate) : null;
        
        // Validar que si se proveen fechas sean sintácticamente válidas
        if (data.lastPaymentDate && isNaN(parsedLastPayment!.getTime())) {
          throw new Error('La fecha de último pago no es válida');
        }
        if (data.nextDueDate && isNaN(parsedNextDue!.getTime())) {
          throw new Error('La fecha de vencimiento no es válida');
        }

        const status = this.computeStatus(parsedNextDue);
        const parsedAmount = data.amount ? parseFloat(data.amount.toString()) : 0.0;

        // Crear registro en la base de datos
        const client = await this.prisma.client.create({
          data: {
            fullName,
            dni,
            contactName: data.contactName?.toString().trim() || '',
            phone: data.phone?.toString().trim() || null,
            address: data.address?.toString().trim() || null,
            flowers: data.flowers?.toString().trim() || '',
            amount: parsedAmount,
            remarks: data.remarks?.toString().trim() || null,
            status,
            lastPaymentDate: parsedLastPayment,
            nextDueDate: parsedNextDue,
            sectorId: resolvedSectorId,
          },
        });

        // Registrar en el historial de movimientos
        await this.prisma.history.create({
          data: {
            userId,
            clientId: client.id,
            action: 'CLIENT_CREATE',
            details: `Se registró al cliente ${client.fullName} (DNI: ${client.dni}) mediante importación masiva.`,
          },
        });

        // Agregar al set para evitar duplicados en el mismo archivo cargado
        existingDnis.add(dni);
        results.successCount++;
      } catch (err: any) {
        results.failedCount++;
        results.errors.push({
          row: rowNum,
          client: clientIdentifier,
          reason: err.message || 'Error desconocido al insertar el registro',
        });
      }
    }

    return results;
  }

  // Consulta de reportes analíticos con filtros complejos
  async getReports(params: {
    startDate?: string;
    endDate?: string;
    dateType?: 'nextDueDate' | 'lastPaymentDate' | 'createdAt';
    status?: string;
    sectorIds?: string;
    search?: string;
  }) {
    const { startDate, endDate, dateType = 'nextDueDate', status, sectorIds, search } = params;

    const where: any = {};

    // Filtros de fecha
    if (startDate || endDate) {
      where[dateType] = {};
      if (startDate) {
        where[dateType].gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where[dateType].lte = end;
      }
    }

    // Filtros por estado
    if (status) {
      const statusList = status.split(',').map((s) => s.trim()) as ClientStatus[];
      where.status = { in: statusList };
    }

    // Filtros por sector
    if (sectorIds) {
      const sectorIdList = sectorIds.split(',').map((s) => s.trim());
      where.sectorId = { in: sectorIdList };
    }

    // Filtros de búsqueda libre
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { dni: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Obtener clientes filtrados
    const rawClients = await this.prisma.client.findMany({
      where,
      include: {
        sector: { select: { id: true, name: true } },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
      orderBy: { fullName: 'asc' },
    });

    // Sincronizar estados en tiempo real
    const clients = await Promise.all(
      rawClients.map(async (c) => {
        const synced = await this.syncStatus(c);
        return {
          ...synced,
          sector: c.sector,
          payments: c.payments,
        };
      }),
    );

    // Calcular estadísticas globales agregadas de los resultados
    let totalRevenue = 0;
    let activeCount = 0;
    let pendingCount = 0;
    let expiredCount = 0;

    clients.forEach((c) => {
      totalRevenue += c.amount || 0;
      if (c.status === ClientStatus.ACTIVE) activeCount++;
      else if (c.status === ClientStatus.PENDING) pendingCount++;
      else if (c.status === ClientStatus.EXPIRED) expiredCount++;
    });

    return {
      clients,
      summary: {
        totalClients: clients.length,
        totalRevenue,
        activeCount,
        pendingCount,
        expiredCount,
      },
    };
  }
}
