import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { PrismaService } from './features/prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const dsn = config.get('SENTRY_DSN');

  if (dsn) {
    const sentry = await import('@sentry/node');
    sentry.init({
      dsn,
    });
  }

  app.enableCors({
    origin: '*',
  });
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);
  await app.listen(3000);
}
bootstrap();
