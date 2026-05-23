import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req, BadRequestException } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClientStatus } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  create(@Body() createClientDto: CreateClientDto, @Req() req: any) {
    return this.clientsService.create(createClientDto, req.user.id);
  }

  @Post('bulk')
  bulkCreate(@Body() body: any[], @Req() req: any) {
    if (!Array.isArray(body)) {
      throw new BadRequestException('El cuerpo de la petición debe ser un arreglo de clientes');
    }
    return this.clientsService.bulkCreate(body, req.user.id);
  }

  @Get('reports')
  getReports(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('dateType') dateType?: 'nextDueDate' | 'lastPaymentDate' | 'createdAt',
    @Query('status') status?: string,
    @Query('sectorIds') sectorIds?: string,
    @Query('search') search?: string,
  ) {
    return this.clientsService.getReports({
      startDate,
      endDate,
      dateType,
      status,
      sectorIds,
      search,
    });
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: ClientStatus,
    @Query('sectorId') sectorId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.clientsService.findAll({
      search,
      status,
      sectorId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string, 
    @Body() updateClientDto: UpdateClientDto,
    @Req() req: any
  ) {
    return this.clientsService.update(id, updateClientDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.clientsService.remove(id, req.user.id);
  }

  // Endpoint extra para sincronizar/forzar actualización de todos los estados
  @Post('sync-statuses')
  syncStatuses() {
    return this.clientsService.syncAllClientStatuses();
  }
}
