import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSectorDto } from './dto/create-sector.dto';
import { UpdateSectorDto } from './dto/update-sector.dto';

@Injectable()
export class SectorsService {
  constructor(private prisma: PrismaService) {}

  async create(createSectorDto: CreateSectorDto) {
    const existing = await this.prisma.sector.findUnique({
      where: { name: createSectorDto.name },
    });

    if (existing) {
      throw new BadRequestException(`El sector con el nombre '${createSectorDto.name}' ya existe.`);
    }

    return this.prisma.sector.create({
      data: createSectorDto,
    });
  }

  async findAll() {
    const sectors = await this.prisma.sector.findMany({
      include: {
        _count: {
          select: { clients: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return sectors.map((sector) => {
      const occupied = sector._count.clients;
      return {
        id: sector.id,
        name: sector.name,
        totalCapacity: sector.totalCapacity,
        occupied,
        available: Math.max(0, sector.totalCapacity - occupied),
        createdAt: sector.createdAt,
      };
    });
  }

  async findOne(id: string) {
    const sector = await this.prisma.sector.findUnique({
      where: { id },
      include: {
        clients: {
          select: {
            id: true,
            fullName: true,
            dni: true,
            status: true,
            phone: true,
          },
          orderBy: { fullName: 'asc' },
        },
        _count: {
          select: { clients: true },
        },
      },
    });

    if (!sector) {
      throw new NotFoundException(`El sector solicitado no existe.`);
    }

    const occupied = sector._count.clients;
    return {
      id: sector.id,
      name: sector.name,
      totalCapacity: sector.totalCapacity,
      occupied,
      available: Math.max(0, sector.totalCapacity - occupied),
      clients: sector.clients,
      createdAt: sector.createdAt,
    };
  }

  async update(id: string, updateSectorDto: UpdateSectorDto) {
    await this.findOne(id); // Valida existencia

    if (updateSectorDto.name) {
      const existing = await this.prisma.sector.findFirst({
        where: { 
          name: updateSectorDto.name,
          NOT: { id },
        },
      });
      if (existing) {
        throw new BadRequestException(`Ya existe otro sector con el nombre '${updateSectorDto.name}'.`);
      }
    }

    return this.prisma.sector.update({
      where: { id },
      data: updateSectorDto,
    });
  }

  async remove(id: string) {
    const sector = await this.prisma.sector.findUnique({
      where: { id },
      include: {
        _count: {
          select: { clients: true },
        },
      },
    });

    if (!sector) {
      throw new NotFoundException(`El sector solicitado no existe.`);
    }

    if (sector._count.clients > 0) {
      throw new BadRequestException(
        `No se puede eliminar el '${sector.name}' porque tiene ${sector._count.clients} clientes asignados. Por favor, reasigne o elimine a los clientes primero.`,
      );
    }

    return this.prisma.sector.delete({
      where: { id },
    });
  }
}
