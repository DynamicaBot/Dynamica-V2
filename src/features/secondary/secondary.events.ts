import { Inject, Injectable } from "@nestjs/common";
import { ActivityType } from "discord.js";
import { Context, type ContextOf, On } from "necord";

import { MqttService } from "@/features/mqtt";

import { getPresence } from "@/utils/presence";

import { IntentsError, SecondaryService } from "./secondary.service";
import { type Drizzle, DRIZZLE_TOKEN } from "../drizzle/drizzle.module";
import { count, eq } from "drizzle-orm";
import { primaryTable, secondaryTable } from "../drizzle/schema";

@Injectable()
export class SecondaryEvents {
	constructor(
		@Inject(DRIZZLE_TOKEN) private readonly db: Drizzle,
		private readonly secondaryService: SecondaryService,
		private readonly mqtt: MqttService,
	) {}

	private async getSecondaryChannel(id?: string | null) {
		if (!id) return undefined;

		const secondaryChannel = await this.db.query.secondaryTable.findFirst({
			where: eq(secondaryTable.id, id),
			columns: {
				id: true,
				guildId: true,
				primaryId: true,
			},
		});

		return secondaryChannel;
	}

	private async getPrimaryChannel(id?: string | null) {
		if (!id) return undefined;

		const primaryChannel = await this.db.query.primaryTable.findFirst({
			where: eq(primaryTable.id, id),
			columns: {
				id: true,
				guildId: true,
			},
		});

		return primaryChannel;
	}

	@On("voiceStateUpdate")
	public async onVoiceStateUpdate(
		@Context() [oldVoiceState, newVoiceState]: ContextOf<"voiceStateUpdate">,
	) {
		// If they're not in a channel
		if (!oldVoiceState.channelId && !newVoiceState.channelId) {
			return;
		}

		// Channel didn't change
		if (oldVoiceState.channelId === newVoiceState.channelId) {
			return;
		}

		const oldSecondary = await this.getSecondaryChannel(
			oldVoiceState.channelId,
		);

		// If someone leaves a secondary channel
		if (oldSecondary) {
			await this.secondaryService.update(oldSecondary.guildId, oldSecondary.id);
		}

		// The channel they joined is a secondary channel
		const newSecondary = await this.getSecondaryChannel(
			newVoiceState.channelId,
		);

		// They used to be in a primary channel
		const oldPrimary = await this.getPrimaryChannel(oldVoiceState.channelId);

		// Only update the secondary if they didn't come from it's primary channel
		if (newSecondary && newSecondary?.primaryId !== oldPrimary?.id) {
			const channelId = newSecondary.id;
			await this.secondaryService.update(newSecondary.guildId, channelId);

			return; // They joined a secondary channel, not a primary channel
		}

		const newPrimary = await this.getPrimaryChannel(newVoiceState.channelId);

		// Joined a primary channel
		if (newPrimary) {
			const channelId = newPrimary.id;

			const newStateMember = newVoiceState.member;

			if (!newStateMember) throw new IntentsError("Guild member");

			await this.secondaryService.create(
				newVoiceState.guild.id,
				channelId,
				newVoiceState.member.id,
			);
		}
	}

	@On("channelDelete")
	public async onChannelDelete(
		@Context() [channel]: ContextOf<"channelDelete">,
	) {
		if (channel.isDMBased()) return;

		const databaseChannel = await this.getSecondaryChannel(channel.id);

		if (!databaseChannel) return;

		await this.db
			.delete(secondaryTable)
			.where(eq(secondaryTable.id, channel.id));

		const [{ secondaryCount }] = await this.db
			.select({
				secondaryCount: count(),
			})
			.from(secondaryTable);
		const [{ primaryCount }] = await this.db
			.select({
				primaryCount: count(),
			})
			.from(primaryTable);

		channel.client.user.setPresence(getPresence(primaryCount + secondaryCount));

		this.mqtt.publish("dynamica/secondaries", secondaryCount);
	}

	@On("presenceUpdate")
	public async onPresenceUpdate(
		@Context() [oldPresence, newPresence]: ContextOf<"presenceUpdate">,
	) {
		const channelId = newPresence?.member?.voice?.channelId;
		const guildId = newPresence?.guild?.id || oldPresence?.guild?.id;
		if (!channelId || !guildId) return;

		const databaseSecondary = await this.getSecondaryChannel(channelId);

		if (!databaseSecondary) return;

		const oldPresenceActivity = oldPresence?.activities ?? [];

		const oldActivities = oldPresenceActivity.filter(
			(activity) =>
				activity.type === ActivityType.Playing ||
				activity.type === ActivityType.Competing,
		);

		const oldActivityList = [
			...new Set(oldActivities.map((activity) => activity.name)),
		].sort();

		const newActivities = (newPresence.activities ?? []).filter(
			(activity) =>
				activity.type === ActivityType.Playing ||
				activity.type === ActivityType.Competing,
		);

		const newActivityList = [
			...new Set(newActivities.map((activity) => activity.name)),
		].sort();

		const isSameActivities =
			JSON.stringify(oldActivityList) === JSON.stringify(newActivityList);

		if (isSameActivities) return;

		if (newPresence.guild) {
			this.secondaryService.updateName(newPresence.guild.id, channelId);
		}
	}
}
