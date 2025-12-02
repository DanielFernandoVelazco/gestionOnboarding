import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import helmet from 'helmet';
import compression from 'compression';
import { loggerGlobal } from './middleware/logger.middleware';
import { DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global Logger Middleware
  app.use(loggerGlobal);

  // Security
  app.use(helmet());

  // Compression
  app.use(compression());

  // CORS
  app.enableCors({
    origin: configService.get('app.corsOrigin'),
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix(configService.get<string>('app.apiPrefix') ?? 'api');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Gestión de Onboarding API')
    .setDescription('API para la gestión de onboarding técnico de colaboradores')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const port = configService.get('app.port');
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`API prefix: /${configService.get('app.apiPrefix')}`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();