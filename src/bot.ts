import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { PrismaService } from './features/prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);
}
bootstrap();
