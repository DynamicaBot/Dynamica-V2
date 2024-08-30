import { Global, Module } from "@nestjs/common";
import * as schema from "./schema";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { env } from "@/env";

export const DRIZZLE_TOKEN = Symbol("DRIZZLE_TOKEN");

@Global()
@Module({
	exports: [DRIZZLE_TOKEN],
	providers: [
		{
			provide: DRIZZLE_TOKEN,
			inject: [],
			useFactory: async () => {
				const postgresUrl = env.POSTGRES_URL;

				// for migrations
				const migrationClient = postgres(postgresUrl, { max: 1 });
				await migrate(drizzle(migrationClient), {
					migrationsFolder: "drizzle",
				});

				// for query purposes
				const queryClient = postgres(postgresUrl);
				const db = drizzle(queryClient, { schema });

				return db;
			},
		},
	],
})
export class DrizzleModule {}

export type Drizzle = PostgresJsDatabase<typeof schema>;
