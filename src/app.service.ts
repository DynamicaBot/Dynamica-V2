import { Inject, Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { OAuth2Scopes, PermissionFlagsBits } from "discord.js";
import {
	Context,
	type ContextOf,
	On,
	Once,
	SlashCommand,
	type SlashCommandContext,
} from "necord";

import { GuildService } from "./features/guild/guild.service";
import { MqttService } from "./features/mqtt/mqtt.service";
import { PrimaryService } from "./features/primary/primary.service";
import { SecondaryService } from "./features/secondary/secondary.service";
import { getPresence } from "./utils/presence";
import {
	aliasTable,
	guildTable,
	primaryTable,
	secondaryTable,
} from "./features/drizzle/schema";
import { type Drizzle, DRIZZLE_TOKEN } from "./features/drizzle/drizzle.module";
import { count, sql } from "drizzle-orm";

@Injectable()
export class AppService {
	private readonly logger = new Logger(AppService.name);
	constructor(
		@Inject(DRIZZLE_TOKEN) private readonly db: Drizzle,
		private readonly secondaryService: SecondaryService,
		private readonly primaryService: PrimaryService,
		private readonly guildService: GuildService,
		private readonly mqtt: MqttService,
	) {}

	@Once("ready")
	public async onReady(@Context() [client]: ContextOf<"ready">) {
		this.logger.log(`Bot logged in as ${client.user.tag}`);
		const inviteLink = client.generateInvite({
			scopes: [OAuth2Scopes.ApplicationsCommands, OAuth2Scopes.Bot],
			permissions: [PermissionFlagsBits.Administrator],
		});

		this.logger.log(`Invite Link: ${inviteLink}`);

		await this.cleanup();

		const [{ guildCount }] = await this.db
			.select({
				guildCount: count(),
			})
			.from(guildTable);
		const [{ primaryCount }] = await this.db
			.select({
				primaryCount: count(),
			})
			.from(primaryTable);

		const [{ secondaryCount }] = await this.db
			.select({
				secondaryCount: count(),
			})
			.from(secondaryTable);

		const [{ aliasCount }] = await this.db
			.select({
				aliasCount: count(),
			})
			.from(aliasTable);
		await Promise.all([
			this.mqtt.publish("dynamica/guilds", guildCount),
			this.mqtt.publish("dynamica/primaries", primaryCount),
			this.mqtt.publish("dynamica/secondaries", secondaryCount),
			this.mqtt.publish("dynamica/aliases", aliasCount),
			this.mqtt.publish("dynamica/presence", client.readyAt.toISOString()),
		]);

		const totalChannels = primaryCount + secondaryCount;

		client.user.setPresence(getPresence(totalChannels));
	}

	@On("warn")
	public onWarn(@Context() [message]: ContextOf<"warn">) {
		this.logger.warn(message);
	}

	@SlashCommand({
		name: "ping",
		description: "Ping the bot",
	})
	public onPing(@Context() [interaction]: SlashCommandContext) {
		return interaction.reply({
			content: `Pong from JavaScript! Bot Latency ${Math.round(
				interaction.client.ws.ping,
			)}ms.`,
			ephemeral: true,
		});
	}

	@Cron("0 0 * * *")
	public async cleanup() {
		await this.guildService.cleanup();

		await this.primaryService.cleanup();

		await this.secondaryService.cleanup();
	}
}
