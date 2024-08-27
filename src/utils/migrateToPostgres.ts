import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

config();

import * as schema from '../features/drizzle/schema';
import {
  migratedTable,
  primaryTable,
  guildTable,
  secondaryTable,
  aliasTable,
} from '../features/drizzle/schema';

const databaseUrl = process.env.DATABASE_URL;

const postgresUrl = process.env.POSTGRES_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL must be set');
}

if (!postgresUrl) {
  throw new Error('POSTGRES_URL must be set');
}

// for migrations
const migrationClient = postgres(postgresUrl, { max: 1 });
await migrate(drizzle(migrationClient), {
  migrationsFolder: 'drizzle',
});

// for query purposes
const queryClient = postgres(postgresUrl);
const db = drizzle(queryClient, { schema });

const prisma = new PrismaClient({ datasourceUrl: databaseUrl });

// get number of migrated entries
const migrated = await db.query.migratedTable.findFirst();

if (migrated) {
  console.log('Already migrated');
} else {
  // Guild
  const prismaGuilds = await prisma.guild.findMany();
  if (prismaGuilds.length) {
    console.log({ prismaGuilds });
    const drizzleGuilds = await db
      .insert(guildTable)
      .values(prismaGuilds)
      .onConflictDoNothing()
      .returning();
    console.log({ drizzleGuilds });
  }

  // Aliases
  const prismaAliases = await prisma.alias.findMany();
  if (prismaAliases.length) {
    console.log({ prismaAliases });
    const drizzleAliases = await db
      .insert(aliasTable)
      .values(prismaAliases)
      .onConflictDoNothing()
      .returning();
    console.log({ drizzleAliases });
  }

  // Primaries
  const prismaPrimaries = await prisma.primary.findMany();
  if (prismaPrimaries.length) {
    console.log({ prismaPrimaries });
    const drizzlePrimaries = await db
      .insert(primaryTable)
      .values(prismaPrimaries)
      .onConflictDoNothing()
      .returning();
    console.log({ drizzlePrimaries });
  }

  // Secondaries
  const prismaSecondaries = await prisma.secondary.findMany();

  if (prismaSecondaries.length) {
    console.log({ prismaSecondaries });
    const drizzleSecondaries = await db
      .insert(secondaryTable)
      .values(prismaSecondaries)
      .onConflictDoNothing()
      .returning();
    console.log({ drizzleSecondaries });
  }

  await db
    .insert(migratedTable)
    .values({
      createdAt: new Date(),
    })
    .returning();
}

process.exit(0);
