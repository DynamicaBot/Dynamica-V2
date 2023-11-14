import path from 'path';
import { fileURLToPath } from 'url';

import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import * as schema from '../../db/schema';

export const DRIZZLE_TOKEN = Symbol('DRIZZLE_TOKEN');

@Global()
@Module({
  exports: [DRIZZLE_TOKEN],
  providers: [
    {
      provide: DRIZZLE_TOKEN,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const dbPath = configService
          .getOrThrow<string>('DATABASE_URL')
          .replace('file:', '');

        const rootFilePath = fileURLToPath(import.meta.url);
        const rootFolderPath = path.dirname(rootFilePath);
        const migrationsPath = path.join(rootFolderPath, 'db', 'migrations');

        const sqlite = new Database(dbPath, {
          verbose: console.log,
        });
        // console.log(migrate);
        const db = drizzle(sqlite, {
          schema,
          logger: false,
        });
        await migrate(db, {
          migrationsFolder: migrationsPath,
        });

        return db;
      },
    },
  ],
})
export class PrismaModule {}

export type Drizzle = ReturnType<typeof drizzle>;
