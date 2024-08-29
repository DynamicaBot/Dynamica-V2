import { Inject, Injectable } from "@nestjs/common";
import {
	ActionRowBuilder,
	ChannelType,
	type Client,
	type ModalActionRowComponentBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";

import type { MqttService } from "@/features/mqtt";

import type { SecondaryService } from "@/features/secondary";
import { getPresence } from "@/utils/presence";
import { type Drizzle, DRIZZLE_TOKEN } from "../drizzle/drizzle.module";
import { primaryTable, secondaryTable } from "../drizzle/schema";
import { and, count, eq } from "drizzle-orm";
import { IntentsError } from "../secondary/secondary.service";

@Injectable()
export class PrimaryService {
	public constructor(
		private readonly client: Client,
		@Inject(DRIZZLE_TOKEN) private readonly db: Drizzle,
		private readonly secondaryService: SecondaryService,
		private readonly mqtt: MqttService,
	) {}

	/**
	 * Create a primary channel
	 * @param creator The user id of the creator
	 * @param guildId The guild id to create the primary in
	 * @param sectionId The section id to create the primary in
	 * @returns The created primary
	 */
	public async create(creator: string, guildId: string, sectionId?: string) {
		const guild = await this.client.guilds.fetch(guildId);

		const channelId = await guild.channels.create({
			name: "➕ New Session",
			type: ChannelType.GuildVoice,
			parent: sectionId,
		});

		await this.db.insert(primaryTable).values({
			guildId: guild.id,
			id: channelId.id,
			creator,
			generalName: "General ##",
			template: "@@game@@ ##",
		});

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

		if (this.client.user) {
			this.client.user.setPresence(getPresence(primaryCount + secondaryCount));
		}
		await this.mqtt.publish("dynamica/primaries", primaryCount);

		return channelId;
	}

	/**
	 * Update a primary in the database, if the bot has left the guild, delete it
	 * @param guildId The guild id to update primaries
	 * @param id The primary id to update
	 * @returns The updated primary
	 */
	public async update(guildId: string, id: string) {
		const primary = await this.client.channels.fetch(id);

		if (!primary) {
			throw new IntentsError("Client channel");
		}

		if (primary.type !== ChannelType.GuildVoice) {
			return;
		}

		const { members } = primary;

		const firstMember = members.first();

		const rest = members.filter((member) => member.id !== firstMember?.id);

		if (firstMember) {
			const newChannel = await this.secondaryService.create(
				guildId,
				id,
				firstMember.id,
			);
			await Promise.all(
				rest.map((member) => member.voice.setChannel(newChannel.id)),
			);
		}
	}

	/**
	 * Cleanup primaries that are no longer in the guild
	 */
	public async cleanup() {
		const primaries = await this.db
			.select({ id: primaryTable.id, guildId: primaryTable.guildId })
			.from(primaryTable);
		await Promise.all(
			primaries.map(({ id, guildId }) => this.update(guildId, id)),
		);
	}

	/**
	 * Update secondaries for a primary
	 * @param guildId The guild id to update secondaries for
	 * @param primaryId The primary id to update secondaries for
	 * @returns The updated primary
	 */
	public async updateSecondaries(guildId: string, primaryId: string) {
		const databasePrimary = await this.db.query.primaryTable.findFirst({
			where: and(
				eq(primaryTable.id, primaryId),
				eq(primaryTable.guildId, guildId),
			),
			with: {
				secondaries: true,
			},
		});

		if (!databasePrimary) {
			throw new Error("No primary found");
		}

		const { secondaries } = databasePrimary;

		await Promise.all(
			secondaries.map(({ id }) => this.secondaryService.update(guildId, id)),
		);

		return databasePrimary.secondaries;
	}

	/**
	 * Update the general template for a primary
	 * @param guildId The guild id to update the general template for
	 * @param primaryId The primary id to update the general template for
	 * @param newTemplate The new general template
	 * @returns The updated primary
	 */
	public async general(
		guildId: string,
		primaryId: string,
		newTemplate: string,
	) {
		const databasePrimary = await this.db.query.primaryTable.findFirst({
			where: and(
				eq(primaryTable.id, primaryId),
				eq(primaryTable.guildId, guildId),
			),
		});

		if (!databasePrimary) {
			throw new Error("No primary found");
		}

		const [updatedPrimary] = await this.db
			.update(primaryTable)
			.set({
				generalName: newTemplate,
			})
			.where(
				and(eq(primaryTable.guildId, guildId), eq(primaryTable.id, primaryId)),
			)
			.returning();

		await this.updateSecondaries(guildId, primaryId);

		return updatedPrimary;
	}

	/**
	 * Update the game template for a primary
	 * @param guildId Update the game template for a primary
	 * @param primaryId The primary id to update the game template for
	 * @param newTemplate The new game template
	 * @returns The updated primary
	 */
	public async template(
		guildId: string,
		primaryId: string,
		newTemplate: string,
	) {
		const databasePrimary = await this.db.query.primaryTable.findFirst({
			where: and(
				eq(primaryTable.id, primaryId),
				eq(primaryTable.guildId, guildId),
			),
		});

		if (!databasePrimary) {
			throw new Error("No primary found");
		}

		const updatedPrimary = await this.db
			.update(primaryTable)
			.set({
				template: newTemplate,
			})
			.where(
				and(eq(primaryTable.guildId, guildId), eq(primaryTable.id, primaryId)),
			)
			.returning();

		await this.updateSecondaries(guildId, primaryId);

		return updatedPrimary;
	}

	/**
	 * Get the primary info
	 * @param guildId The guild id to get the primary from
	 * @param primaryId The primary id to get the info for
	 * @returns The primary info
	 */
	public async info(guildId: string, primaryId: string) {
		const databasePrimary = await this.db.query.primaryTable.findFirst({
			where: and(
				eq(primaryTable.id, primaryId),
				eq(primaryTable.guildId, guildId),
			),
			with: {
				secondaries: true,
			},
		});

		if (!databasePrimary) {
			throw new Error("No primary found");
		}

		return databasePrimary;
	}

	public async createPrimaryModal(
		guildId: string,
		id: string,
	): Promise<ModalBuilder> {
		const databasePrimary = await this.db.query.primaryTable.findFirst({
			where: and(eq(primaryTable.id, id), eq(primaryTable.guildId, guildId)),
		});

		if (!databasePrimary) {
			throw new Error("No primary found");
		}

		const { generalName, template } = databasePrimary;

		return new ModalBuilder()
			.setTitle("Edit Primary Channel")
			.setCustomId(`primary/${id}`)
			.setComponents([
				new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents([
					new TextInputBuilder()
						.setCustomId("general")
						.setLabel("General Template")
						.setStyle(TextInputStyle.Short)
						.setValue(generalName),
				]),
				new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents([
					new TextInputBuilder()
						.setCustomId("template")
						.setLabel("Game Template")
						.setStyle(TextInputStyle.Short)
						.setValue(template),
				]),
			]);
	}
}
