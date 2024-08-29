import { Inject, Injectable, Logger } from "@nestjs/common";
import { Context, type ContextOf, On } from "necord";

import { MqttService } from "@/features/mqtt";

import { type Drizzle, DRIZZLE_TOKEN } from "../drizzle/drizzle.module";
import { guildTable } from "../drizzle/schema";
import { count, eq } from "drizzle-orm";

@Injectable()
export class GuildEvents {
	constructor(
		@Inject(DRIZZLE_TOKEN) private readonly db: Drizzle,
		private readonly mqtt: MqttService,
	) {}

	private readonly logger = new Logger(GuildEvents.name);

	@On("guildCreate")
	public async onGuildCreate(
		@Context() [discordGuild]: ContextOf<"guildCreate">,
	) {
		await this.db
			.insert(guildTable)
			.values({
				id: discordGuild.id,
				allowJoinRequests: false,
			})
			.execute();

		const [{ guildCount }] = await this.db
			.select({
				guildCount: count(),
			})
			.from(guildTable);

		this.logger.log(`Joined guild ${discordGuild.name} (${discordGuild.id})`);
		await this.mqtt.publish("dynamica/guilds", guildCount);
	}

	@On("guildDelete")
	public async onGuildDelete(
		@Context() [discordGuild]: ContextOf<"guildDelete">,
	) {
		await this.db.delete(guildTable).where(eq(guildTable.id, discordGuild.id));
		const [{ guildCount }] = await this.db
			.select({
				guildCount: count(),
			})
			.from(guildTable);

		this.logger.log(`Left guild ${discordGuild.name} (${discordGuild.id})`);
		await this.mqtt.publish("dynamica/guilds", guildCount);
	}
}
