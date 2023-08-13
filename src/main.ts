import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const dsn = config.get<string>('SENTRY_DSN');
  const version = config.get<string>('VERSION');

  if (dsn) {
    const sentry = await import('@sentry/node');
    sentry.init({
      dsn,
      release: version,
    });
  }

  app.enableCors({
    origin: '*',
  });
  await app.listen(3000);
}
bootstrap();
