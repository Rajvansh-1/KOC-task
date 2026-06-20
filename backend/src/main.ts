import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Cookie parser (must be before any guard reads cookies) ───────────────
  app.use(cookieParser());

  // ── CORS ─────────────────────────────────────────────────────────────────
  // credentials: true is REQUIRED for httpOnly cookie to be sent cross-origin
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ── Global Validation Pipe ───────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // strips unknown properties
      forbidNonWhitelisted: true, // throws on unknown properties
      transform: true,           // auto-transform payload types
    }),
  );

  // ── Global Response Interceptor ──────────────────────────────────────────
  app.useGlobalInterceptors(new ResponseInterceptor());

  // ── Global Exception Filter ──────────────────────────────────────────────
  app.useGlobalFilters(new AllExceptionsFilter());

  // ── API versioning prefix ────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}/api/v1`);
}

bootstrap();
