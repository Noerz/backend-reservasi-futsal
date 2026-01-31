import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { LoggerService } from './common/logger.service';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new LoggerService(),
  });

  // Set global prefix dulu sebelum static assets
  app.setGlobalPrefix('api/v1');

  // Serve static files untuk uploads - gunakan process.cwd() agar path selalu dari root project
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Enable validation pipe untuk DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS - konfigurasi untuk shared hosting
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  const port = parseInt(process.env.PORT || '4000');
  const host = process.env.HOST || '0.0.0.0';
  
  await app.listen(port, host);

  // Log server info
  const logger = app.get(LoggerService);
  logger.logServerInfo(port);
}
bootstrap();
