import { Inject, Injectable, Logger } from "@nestjs/common";
import { DiscordAPIError, Client } from "discord.js";

import { MqttService } from "@/features/mqtt";

import { type Drizzle, DRIZZLE_TOKEN } from "../drizzle/drizzle.module";
import { guildTable } from "../drizzle/schema";
import { eq } from "drizzle-orm";

@Injectable()
export class GuildService {
	public constructor(
		@Inject(DRIZZLE_TOKEN) private readonly db: Drizzle,
		private readonly client: Client,
	) {}

	private readonly logger = new Logger(GuildService.name);

	/**
	 * Update a guild in the database, if the bot has left the guild, delete it
	 * @param id The guild id to update
	 */
	public async update(id: string) {
		try {
			await this.client.guilds.fetch(id);
		} catch (error) {
			if (error instanceof DiscordAPIError && error.code === 10004) {
				this.db.delete(guildTable).where(eq(guildTable.id, id));
			} else {
				this.logger.error("Failed to fetch channel", error);
				// throw error;
			}
		}
	}

	/**
	 * Cleanup guilds that the bot has left
	 */
	public async cleanup() {
		const guilds = await this.db.select({ id: guildTable.id }).from(guildTable);
		await Promise.allSettled(guilds.map(({ id }) => this.update(id)));
	}

	/**
	 * Toggle allow join requests for a guild
	 * @param guildId The guild id to toggle allow join requests for
	 * @returns The updated guild
	 */
	public async allowjoin(guildId: string) {
		const [dbGuild] = await this.db
			.select({
				id: guildTable.id,
				allowJoinRequests: guildTable.allowJoinRequests,
			})
			.from(guildTable)
			.where(eq(guildTable.id, guildId));

		if (!dbGuild) {
			throw new Error("Guild not found, please kick and reinvite the bot");
		}

		const [newGuild] = await this.db
			.update(guildTable)
			.set({
				allowJoinRequests: !dbGuild.allowJoinRequests,
			})
			.where(eq(guildTable.id, guildId))
			.returning();

		return newGuild;
	}

	public async info(guildId: string) {
		const guild = await this.db.query.guildTable.findFirst({
			where: eq(guildTable.id, guildId),
			with: {
				primaryChannels: true,
				secondaryChannels: true,
			},
		});

		if (!guild) {
			throw new Error("Guild not found");
		}

		return guild;
	}
}
