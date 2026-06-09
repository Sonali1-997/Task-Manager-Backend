import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global input validation — DTOs are the contract for every endpoint.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties not in the DTO
      forbidNonWhitelisted: true, // reject unknown properties
      transform: true, // coerce payloads to DTO instances
    }),
  );

  // Swagger / OpenAPI docs, served at /docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Task Management API')
    .setDescription('Auth and task-management endpoints')
    .setVersion('1.0')
    .addBearerAuth() // enables the "Authorize" button for JWT
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
