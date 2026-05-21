import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Configuración de prefijo global para endpoints
  app.setGlobalPrefix('api');

  // Habilitar CORS
  app.enableCors({
    origin: '*', // En producción se puede restringir a dominios específicos
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Habilitar validaciones globales para DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remueve propiedades extra que no estén en el DTO
      transform: true, // Transforma tipos automáticamente (ej. string a number)
      forbidNonWhitelisted: true, // Lanza error si envían propiedades no autorizadas
    }),
  );

  const port = configService.get<number>('PORT') || 4000;
  
  await app.listen(port);
  console.log(`🚀 Servidor ejecutándose en: http://localhost:${port}/api`);
}

bootstrap();
