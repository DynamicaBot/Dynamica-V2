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
    const { RewriteFrames } = await import('@sentry/integrations');
    // const rootEsmFile = fileURLToPath(import.meta.url);
    // const rootEsmDir = path.dirname(rootEsmFile);
    Error.stackTraceLimit = Infinity;
    sentry.init({
      dsn,
      release: version,
      integrations: [
        new RewriteFrames({
          prefix: '/',
        }),
      ],
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
