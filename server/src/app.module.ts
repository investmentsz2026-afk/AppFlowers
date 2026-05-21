import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SectorsModule } from './sectors/sectors.module';
import { ClientsModule } from './clients/clients.module';
import { PaymentsModule } from './payments/payments.module';
import { HistoryModule } from './history/history.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    // Variables de entorno cargadas globalmente
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Habilitar tareas programadas (Cron jobs)
    ScheduleModule.forRoot(),
    // Módulos del Sistema
    PrismaModule,
    AuthModule,
    SectorsModule,
    ClientsModule,
    PaymentsModule,
    HistoryModule,
    DashboardModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
