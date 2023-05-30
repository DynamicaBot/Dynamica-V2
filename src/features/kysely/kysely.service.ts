import path from 'path';
import { fileURLToPath } from 'url';

import { Injectable } from '@nestjs/common';
import sqlite from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';

import { DB } from '@/db/types';

@Injectable()
export class KyselyService extends Kysely<DB> {
  constructor() {
    const prismaDBUrl: string = process.env.DATABASE_URL as string | undefined;

    // the primsa url is a file url, so we need to convert it to a path that is relative to the prisma folder or absolute
    const dbUrl = prismaDBUrl
      ? path.resolve(
          path.dirname(fileURLToPath(import.meta.url)),
          prismaDBUrl.replace('file:', ''),
        )
      : undefined;

    super({
      dialect: new SqliteDialect({
        database: sqlite(dbUrl),
      }),
      log: ['error'],
    });
  }
}
