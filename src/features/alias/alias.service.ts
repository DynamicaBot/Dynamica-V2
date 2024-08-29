import { Inject, Injectable } from "@nestjs/common";

import { MqttService } from "@/features/mqtt";

import { DRIZZLE_TOKEN, type Drizzle } from "../drizzle/drizzle.module";
import { aliasTable } from "../drizzle/schema";
import { and, count, eq, sql } from "drizzle-orm";

@Injectable()
export class AliasService {
	constructor(
		@Inject(DRIZZLE_TOKEN) private readonly db: Drizzle,
		private readonly mqtt: MqttService,
	) {}

	/**
	 * Upsert an alias for an activity
	 * @param guildId Guild Id
	 * @param activity Activity name to alias
	 * @param alias Alias to use
	 * @returns Created or updated alias
	 */
	public async upsertAlias(
		guildId: string,
		activity: string,
		aliasStr: string,
	) {
		// const upsertedAlias = await this.db.alias.upsert({
		//   where: {
		//     guildId_activity: {
		//       guildId,
		//       activity,
		//     },
		//   },
		//   update: {
		//     alias,
		//   },
		//   create: {
		//     guildId,
		//     activity,
		//     alias,
		//   },
		// });
		const [upsertedAlias] = await this.db
			.insert(aliasTable)
			.values({
				guildId,
				activity,
				alias: aliasStr,
			})
			.onConflictDoUpdate({
				set: {
					activity,
					alias: aliasStr,
				},
				target: aliasTable.activity,
			})
			.returning();

		const [{ aliasCount }] = await this.db
			.select({
				aliasCount: sql<number>`COUNT(*)`,
			})
			.from(aliasTable);

		await this.mqtt.publish("dynamica/aliases", aliasCount);

		return upsertedAlias;
	}

	/**
	 * Delete an alias for an activity
	 * @param guildId Guild Id
	 * @param activity Activity name to alias
	 * @returns Deleted alias
	 */
	public async deleteAlias(guildId: string, activity: string) {
		const [existingAlias] = await this.db
			.select()
			.from(aliasTable)
			.where(
				and(eq(aliasTable.guildId, guildId), eq(aliasTable.activity, activity)),
			);

		if (!existingAlias) {
			throw new Error("Alias does not exist");
		}

		const [deletedAlias] = await this.db
			.delete(aliasTable)
			.where(
				and(eq(aliasTable.guildId, guildId), eq(aliasTable.activity, activity)),
			)
			.returning();

		const [{ aliasCount }] = await this.db
			.select({
				aliasCount: count(),
			})
			.from(aliasTable);

		await this.mqtt.publish("dynamica/aliases", aliasCount);

		return deletedAlias;
	}

	/**
	 * List all aliases for a guild
	 * @param guildId Guild Id
	 * @returns List of aliases for a guild
	 */
	public async listAliases(guildId: string) {
		const aliases = await this.db
			.select()
			.from(aliasTable)
			.where(eq(aliasTable.guildId, guildId));

		return aliases;
	}
}
