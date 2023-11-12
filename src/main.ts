import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { DiscordExceptionFilter } from './filters/DiscordFilter';
import { SentryFilter } from './filters/SentryFilter';

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

  const { httpAdapter } = app.get(HttpAdapterHost);

  app.useGlobalFilters(
    new SentryFilter(httpAdapter),
    new DiscordExceptionFilter(),
  );
  await app.listen(3000);
}
bootstrap();
