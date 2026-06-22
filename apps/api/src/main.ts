import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefixes and versionings
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // CORS Configurations
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  // Swagger Documentation Setup (OpenAPI 3.1)
  const config = new DocumentBuilder()
    .setTitle('Amdox Technologies ERP API Suite')
    .setDescription('AMX-ERP-2026-04 core API gateway coordinating finances, inventory and microservices')
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || process.env.APP_PORT || 4000;
  await app.listen(port);
  console.log(`NestJS server launched successfully on port ${port}`);
}
bootstrap();
