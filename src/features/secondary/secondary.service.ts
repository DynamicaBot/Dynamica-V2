import { Inject, Injectable, Logger } from "@nestjs/common";
import { OverwriteType, PermissionFlagsBits } from "discord-api-types/v10";
import {
	ActionRowBuilder,
	ActivityType,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	Client,
	DiscordAPIError,
	type GuildMember,
	type ModalActionRowComponentBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ThreadMemberManager,
	UserSelectMenuBuilder,
} from "discord.js";
import emojiList from "emoji-random-list";
import { romanize } from "romans";

import { MqttService } from "@/features/mqtt";

import { getPresence } from "@/utils/presence";
import { type Drizzle, DRIZZLE_TOKEN } from "../drizzle/drizzle.module";
import { aliasTable, primaryTable, secondaryTable } from "../drizzle/schema";
import { and, count, eq } from "drizzle-orm";

@Injectable()
export class SecondaryService {
	private readonly logger = new Logger(SecondaryService.name);

	public constructor(
		private readonly client: Client,
		@Inject(DRIZZLE_TOKEN) private readonly db: Drizzle,
		private readonly mqtt: MqttService,
	) {}

	/**
	 * Delete a secondary service
	 * @param id Channel id to delete
	 * @param guildId The guildId to delete from
	 */
	public async delete(id: string, guildId: string) {
		let discordGuild = this.client.guilds.cache.get(guildId);

		if (!discordGuild) {
			// TODO: See if this still works with channel delete event
			discordGuild = await this.client.guilds.fetch(guildId);
		}

		const discordChannel = await discordGuild.channels.fetch(id);

		if (discordChannel?.manageable) {
			await discordChannel.delete();
		}
	}

	/**
	 * Create a secondary channel
	 * @param guildId The guild ID
	 * @param primaryId The primary channel ID
	 * @param userId The user ID
	 * @returns The newly created secondary channel
	 */
	public async create(guildId: string, primaryId: string, userId: string) {
		const discordGuild = await this.client.guilds.fetch(guildId);
		const discordGuildMember = await discordGuild.members.fetch(userId);

		const discordPrimary = await discordGuild.channels.fetch(primaryId);

		if (discordPrimary === null) {
			throw new Error("Intents error, cannot fetch guild channel");
		}

		const parent =
			discordPrimary.parent?.type === ChannelType.GuildCategory
				? discordPrimary.parent
				: undefined;

		const channelName = await this.formatName(primaryId, guildId);

		const newDiscordChannel = await discordGuild.channels.create({
			name: channelName,
			parent,
			type: ChannelType.GuildVoice,
			bitrate: discordPrimary.isVoiceBased()
				? discordPrimary.bitrate
				: undefined,
		});

		const emoji: string = emojiList.random({
			skintones: false,
			genders: false,
			group: "smileys-and-emotion,animals-and-nature,food-and-drink",
		})[0];

		// const newDatabaseChannel = await this.db.secondary.create({
		//   data: {
		//     id: newDiscordChannel.id,
		//     emoji,
		//     creator: userId,
		//     lastName: channelName,
		//     primary: {
		//       connect: {
		//         id: primaryId,
		//       },
		//     },
		//     guild: {
		//       connect: {
		//         id: guildId,
		//       },
		//     },
		//   },
		// });
		const [newDatabaseChannel] = await this.db
			.insert(secondaryTable)
			.values({
				id: newDiscordChannel.id,
				guildId: guildId,
				lastName: channelName,
				primaryId: primaryId,
				emoji: emoji,
				creator: userId,
			})
			.returning();

		await discordGuildMember.voice.setChannel(newDiscordChannel);

		const channelSettingsComponents =
			await this.createSecondarySettingsComponents(
				guildId,
				newDiscordChannel.id,
			);

		const clientUser = this.client.user;

		if (clientUser === null) {
			throw new Error("Client user not found");
		}

		const newDiscordChannelPermissions =
			newDiscordChannel.permissionsFor(clientUser);

		if (!newDiscordChannelPermissions) {
			throw new Error("Unable to access permissions");
		}

		if (newDiscordChannelPermissions.has(PermissionFlagsBits.SendMessages)) {
			try {
				await newDiscordChannel.send({
					content: "Edit the channel settings here",
					components: channelSettingsComponents,
				});
			} catch (error) {
				if (error instanceof DiscordAPIError) {
					switch (error.code) {
						case 10003:
							// Channel not found
							this.logger.error(
								`Unable to send message to channel ${newDiscordChannel.id}, unknown channel`,
							);
							break;
						default:
							throw error;
					}
				}
			}
		}

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

		clientUser.setPresence(getPresence(primaryCount + secondaryCount));

		this.mqtt.publish("dynamica/secondaries", secondaryCount.toString());

		return newDatabaseChannel;
	}

	/**
	 * Update the name of a secondary channel
	 * @param channelId The Id of the channel to update the name of
	 * @returns The new name of the channel
	 */
	public async updateName(guildId: string, channelId: string) {
		const discordChannel = await this.client.channels.fetch(channelId);

		if (discordChannel === null) {
			throw new Error("Intents error, cannot fetch guild channel");
		}

		if (discordChannel.isDMBased()) {
			return;
		}

		const databaseChannel = await this.db.query.secondaryTable.findFirst({
			where: and(
				eq(secondaryTable.id, channelId),
				eq(secondaryTable.guildId, guildId),
			),
		});

		if (!databaseChannel) {
			throw new Error("Channel is not a dynamica channel");
		}

		const newName = await this.formatName(
			databaseChannel.primaryId,
			guildId,
			channelId,
		);

		if (databaseChannel.lastName !== newName && discordChannel.manageable) {
			await discordChannel.edit({
				name: newName,
			});
			await this.db
				.update(secondaryTable)
				.set({
					lastName: newName,
				})
				.where(
					and(
						eq(secondaryTable.id, channelId),
						eq(secondaryTable.guildId, guildId),
					),
				);
		}

		return newName;
	}

	/**
	 * Updates a secondary channel (delete if empty, update name if not)
	 * @param channelId The secondary channel id
	 * @returns void
	 */
	public async update(guildId: string, channelId: string, forceFetch = false) {
		const secondaryChannel = await this.db.query.secondaryTable.findFirst({
			where: and(
				eq(secondaryTable.id, channelId),
				eq(secondaryTable.guildId, guildId),
			),
		});

		if (!secondaryChannel) {
			return;
		}

		const discordChannel = await this.client.channels.fetch(channelId, {
			force: forceFetch,
		});

		if (discordChannel === null) {
			throw new IntentsError("Guild channel");
		}

		if (
			discordChannel.type === ChannelType.DM ||
			discordChannel.type === ChannelType.GroupDM
		) {
			return;
		}

		if (discordChannel.members instanceof ThreadMemberManager) {
			return;
		}

		if (
			discordChannel.members.size === 0 &&
			discordChannel.manageable &&
			!secondaryChannel.pinned
		) {
			await discordChannel.delete();
		} else {
			const memberIds = discordChannel.members.map((member) => member.id);

			if (
				secondaryChannel.creator &&
				!memberIds.includes(secondaryChannel.creator)
			) {
				await this.db
					.update(secondaryTable)
					.set({
						creator: memberIds[0] ?? null,
					})
					.where(
						and(
							eq(secondaryTable.id, channelId),
							eq(secondaryTable.guildId, guildId),
						),
					);
			}

			try {
				await this.updateName(guildId, channelId);
			} catch (error) {
				this.logger.error("Failed to update channel name", error);
				throw new NameUpdateError();
			}
		}
	}

	/**
	 * Formats the name of a channel
	 * @param primaryId The Id of the primary channel
	 * @param guildId The Id of the guild
	 * @param channelId The Id of the channel to update the name of (optional)
	 * @returns The new name of the channel
	 */
	private async formatName(
		primaryId: string,
		guildId: string,
		channelId?: string,
	) {
		const discordGuild = await this.client.guilds.fetch(guildId);

		const discordChannel = await discordGuild.channels.fetch(
			channelId ?? primaryId,
		);

		if (discordChannel === null) {
			throw new IntentsError("Guild channel");
		}

		if (discordChannel.members instanceof ThreadMemberManager) {
			throw new Error("Thread channel");
		}

		const channelMembers = [...discordChannel.members.values()];

		const activities = channelMembers.flatMap(
			(guildMember) => guildMember.presence?.activities ?? [],
		);

		const filteredActivities = activities.filter(
			(activity) =>
				activity.type === ActivityType.Playing ||
				activity.type === ActivityType.Competing,
		);

		const activityList = [
			...new Set(filteredActivities.map((activity) => activity.name)),
		];

		const aliases = await this.db.query.aliasTable.findMany({
			where: eq(aliasTable.guildId, guildId),
		});

		const aliasObject: Record<string, string> = {};

		for (const { alias, activity } of aliases) {
			aliasObject[activity] = alias;
		}

		const aliasedActivities = activityList.map(
			(activity) => aliasObject[activity] ?? activity,
		);

		let creatorId: string | undefined;
		let secondaryNameOverride: string | undefined;
		let secondaryLocked: boolean | undefined;
		let secondaryEmoji: string | undefined;

		if (channelId) {
			const [databaseSecondary] = await this.db
				.select({
					creator: secondaryTable.creator,
					name: secondaryTable.name,
					locked: secondaryTable.locked,
					emoji: secondaryTable.emoji,
				})

				.from(secondaryTable)
				.where(eq(secondaryTable.id, channelId));

			if (databaseSecondary) {
				creatorId = databaseSecondary.creator ?? undefined;

				secondaryLocked = databaseSecondary.locked;

				secondaryEmoji = databaseSecondary.emoji ?? undefined;

				if (databaseSecondary.name)
					secondaryNameOverride = databaseSecondary.name;
			}
		}

		const creator = creatorId
			? discordChannel.members.get(creatorId)
			: discordChannel.members.at(0);

		const creatorName = creator?.displayName ?? "Unknown";

		const primaryConfig = await this.db.query.primaryTable.findFirst({
			where: eq(primaryTable.id, primaryId),
		});

		if (!primaryConfig) {
			throw new Error("Primary channel not found");
		}

		const channelNameTemplate =
			secondaryNameOverride ??
			(aliasedActivities.length
				? primaryConfig.template
				: primaryConfig.generalName);

		const locked = !!secondaryLocked;

		const memberCount = channelMembers.length;

		const existingSecondaryConfigs = await this.db
			.select()
			.from(secondaryTable)
			.where(eq(secondaryTable.primaryId, primaryId));

		const ownIndex = existingSecondaryConfigs.findIndex(
			(secondary) => channelId === secondary.id,
		);

		const channelNumber =
			ownIndex === -1 ? existingSecondaryConfigs.length + 1 : ownIndex + 1;

		const emoji = secondaryEmoji ?? "❔";

		const plurals = channelNameTemplate.split(/<<(.+)\/(.+)>>/g);

		const nato = [
			"Alpha",
			"Bravo",
			"Charlie",
			"Delta",
			"Echo",
			"Foxtrot",
			"Golf",
			"Hotel",
			"India",
			"Juliett",
			"Kilo",
			"Lima",
			"Mike",
			"November",
			"Oscar",
			"Papa",
			"Quebec",
			"Romeo",
			"Sierra",
			"Tango",
			"Uniform",
			"Victor",
			"Whiskey",
			"X-ray",
			"Yankee",
			"Zulu",
		];

		const formattedString = `${locked ? "🔒 " : ""}${channelNameTemplate
			.replace(/###/g, channelNumber.toString().padStart(3, "0")) // 001
			.replace(/##/g, `#${channelNumber}`) // #1
			.replace(/\$#/g, channelNumber.toString()) // 1
			.replace(/\+#/g, romanize(channelNumber)) // I
			.replace(/@@nato@@/g, nato[channelNumber - 1]) // Alpha
			.replace(/@@num@@/g, memberCount.toString()) // number of channel members
			.replace(/@@game@@/g, aliasedActivities.join(", ")) // Activities
			.replace(/@@creator@@/g, creatorName) // Creator
			.replace(/@@emoji@@/g, emoji) // Random unicode emoji
			.replace(
				/<<(.+)\/(.+)>>/g,
				memberCount === 1 ? plurals[1] : plurals[2],
			)}`; // Plurals

		if (formattedString.length > 100) {
			return `${formattedString.slice(0, 99)}…`;
		}

		return formattedString;
	}

	public async cleanup() {
		const secondaryChannels = await this.db
			.select({
				guildId: secondaryTable.guildId,
				id: secondaryTable.id,
			})
			.from(secondaryTable);

		for (const { id, guildId } of secondaryChannels) {
			try {
				await this.client.channels.fetch(id, { force: true });
			} catch (error) {
				if (error instanceof DiscordAPIError && error.code === 10003) {
					this.db
						.delete(secondaryTable)
						.where(
							and(
								eq(secondaryTable.id, id),
								eq(secondaryTable.guildId, guildId),
							),
						);
				} else {
					this.logger.error("Failed to fetch channel", error);
					// throw error;
				}
			}
		}
	}

	private async checkChannelControl(
		guildId: string,
		channelId: string,
		userId: string,
	) {
		const channel = await this.client.channels.fetch(channelId);

		if (!channel) {
			throw new IntentsError("Client channel");
		}

		if (!channel.isVoiceBased()) {
			throw new Error("Channel is not a voice channel");
		}

		const [databaseSecondary] = await this.db
			.select()
			.from(secondaryTable)
			.where(
				and(
					eq(secondaryTable.id, channelId),
					eq(secondaryTable.guildId, guildId),
				),
			);

		if (!databaseSecondary) {
			throw new Error("No secondary channel found");
		}

		const discordGuild = await this.client.guilds.fetch(guildId);

		const discordMember = await discordGuild.members.fetch(userId);

		if (!discordMember) {
			throw new Error("User not found");
		}
		if (!discordMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
			throw new Error("You do not have permission to do this");
		}

		return { databaseChannel: databaseSecondary, discordChannel: channel };
	}

	/**
	 * Updates the owner of the secondary channel
	 * @param channelId The channel to take ownership of
	 * @param userId The user to take ownership of the channel
	 * @returns The updated secondary channel
	 */
	public async allyourbase(guildId: string, channelId: string, userId: string) {
		const { databaseChannel } = await this.checkChannelControl(
			guildId,
			channelId,
			userId,
		);

		if (databaseChannel.creator === userId) {
			throw new Error("You already own this channel");
		}

		const [updatedSecondary] = await this.db
			.update(secondaryTable)
			.set({
				creator: userId,
			})
			.where(eq(secondaryTable.id, channelId))
			.returning();

		await this.updateName(guildId, updatedSecondary.id);

		return updatedSecondary;
	}

	/**
	 * Updates the bitrate of a dynamica channel
	 * @param channelId The dynamic channel to update
	 * @param bitrate The bitrate to set the channel to
	 * @param userId The user to check if they are the owner of the channel
	 * @returns The updated channel
	 */
	public async bitrate(
		guildId: string,
		channelId: string,
		bitrate: number,
		userId: string,
	) {
		const { discordChannel } = await this.checkChannelControl(
			guildId,
			channelId,
			userId,
		);

		await discordChannel.edit({ bitrate });

		return discordChannel;
	}

	/**
	 * Set a limit on the number of members in a channel
	 * @param guildId The guild that the channel is in
	 * @param channelId The channel to set the limit on
	 * @param limit The limit to set the channel to
	 * @param userId The user to check if they are the owner of the channel
	 * @returns The updated channel
	 */
	public async limit(
		guildId: string,
		channelId: string,
		limit: number,
		userId: string,
	) {
		const { discordChannel } = await this.checkChannelControl(
			guildId,
			channelId,
			userId,
		);

		await discordChannel.edit({ userLimit: limit });

		return discordChannel;
	}

	/**
	 *
	 * @param guildId The id of the guild to update the channel in
	 * @param channelId The id of the channel to update
	 * @param name The name to set the channel to
	 * @param userId The id of the user to check if they are the owner of the channel
	 */
	public async name(
		guildId: string,
		channelId: string,
		name: string | null,
		userId: string,
	) {
		const { discordChannel } = await this.checkChannelControl(
			guildId,
			channelId,
			userId,
		);

		await this.db
			.update(secondaryTable)
			.set({
				name,
			})
			.where(eq(secondaryTable.id, channelId));

		await this.updateName(guildId, channelId);

		return discordChannel;
	}

	public async info(guildId: string, channelId: string) {
		const databaseSecondary = await this.db.query.secondaryTable.findFirst({
			where: and(
				eq(secondaryTable.id, channelId),
				eq(secondaryTable.guildId, guildId),
			),
		});

		if (!databaseSecondary) {
			throw new Error("Channel is not a dynamica channel");
		}

		return databaseSecondary;
	}

	/**
	 * Locks a channel so that only the people currently in the channel can join
	 * @param guildId The id of the guild to update the channel in
	 * @param channelId The id of the channel to update
	 * @param userId The id of the user to check if they are the owner of the channel
	 * @returns The updated channel
	 */
	public async lock(guildId: string, channelId: string, userId: string) {
		const { discordChannel } = await this.checkChannelControl(
			guildId,
			channelId,
			userId,
		);

		const everyoneRole = discordChannel.guild.roles.everyone;

		if (discordChannel.members instanceof ThreadMemberManager) {
			throw new Error("Channel is a thread");
		}

		const currentMembersOfChannel = [...discordChannel.members.values()];

		await discordChannel.edit({
			permissionOverwrites: [
				...currentMembersOfChannel.map((member) => ({
					id: member.id,
					type: OverwriteType.Member,
					allow: [PermissionFlagsBits.Connect],
				})),
				{
					id: everyoneRole.id,
					type: OverwriteType.Role,
					deny: [PermissionFlagsBits.Connect],
				},
			],
		});

		await this.db
			.update(secondaryTable)
			.set({
				locked: true,
			})
			.where(
				and(
					eq(secondaryTable.id, channelId),
					eq(secondaryTable.guildId, guildId),
				),
			);

		await this.updateName(guildId, channelId);

		return discordChannel;
	}

	/**
	 * Unlock a channel
	 * @param guildId Guild id
	 * @param channelId Channel id
	 * @param userId The user to check if they are the owner of the channel
	 * @returns The updated channel
	 */
	public async unlock(guildId: string, channelId: string, userId: string) {
		const { discordChannel } = await this.checkChannelControl(
			guildId,
			channelId,
			userId,
		);

		await discordChannel.edit({
			permissionOverwrites: [],
		});

		await this.db
			.update(secondaryTable)
			.set({
				locked: false,
			})
			.where(
				and(
					eq(secondaryTable.id, channelId),
					eq(secondaryTable.guildId, guildId),
				),
			);

		await this.updateName(guildId, channelId);

		return discordChannel;
	}

	/**
	 * Request to join a channel
	 * @param guildId The guild id
	 * @param channelId The channel the user wishes to join
	 * @param userId The user id of the user who wishes to join
	 * @returns creator
	 */
	public async requestJoin(
		guildId: string,
		channelId: string,
		userId: string,
	): Promise<GuildMember> {
		const guildSettings = await this.db.query.guildTable.findFirst({
			where: eq(primaryTable.id, guildId),
		});

		const databaseSecondary = await this.db.query.secondaryTable.findFirst({
			where: and(
				eq(secondaryTable.id, channelId),
				eq(secondaryTable.guildId, guildId),
			),
		});

		if (!databaseSecondary) {
			throw new Error("Channel is not a dynamica channel");
		}

		if (!databaseSecondary.locked) {
			throw new Error("Channel is not locked");
		}

		if (!guildSettings) {
			throw new Error("Guild not found");
		}

		if (!guildSettings.allowJoinRequests) {
			throw new Error("Join requests are not allowed");
		}

		const channel = await this.client.channels.fetch(channelId);

		if (!channel) {
			throw new IntentsError("Client channel");
		}

		if (channel.isDMBased()) {
			throw new Error("Channel is a DM");
		}

		const member = await channel.guild.members.fetch(userId);

		if (member.permissionsIn(channel).has(PermissionFlagsBits.Connect)) {
			throw new Error("Already in channel");
		}

		// Send join request to channel creator
		if (!databaseSecondary.creator) {
			throw new Error("Channel creator not found");
		}

		const creator = await channel.guild.members.fetch(
			databaseSecondary.creator,
		);

		const joinRequestComponents =
			await this.createSecondaryJoinRequestComponents(
				guildId,
				channelId,
				userId,
			);

		await creator.send({
			content: `User ${member.user.tag} wants to join your channel ${channel.name} in ${channel.guild.name}`,
			components: [joinRequestComponents],
		});

		return creator;
	}

	/**
	 * Accept a join request
	 * @param channelId The channel that the user has been accepted into
	 * @param userId The user that has been accepted into the channel
	 */
	public async acceptJoin(
		channelId: string,
		userId: string,
	): Promise<GuildMember> {
		const channel = await this.client.channels.fetch(channelId);

		if (!channel) {
			throw new IntentsError("Client channel");
		}

		if (channel.isDMBased()) {
			throw new Error("Channel is a DM");
		}

		let member = channel.guild.members.cache.get(userId);

		if (!member) {
			member = await channel.guild.members.fetch(userId);
		}

		if (member.permissionsIn(channel).has(PermissionFlagsBits.Connect)) {
			throw new Error("Already in channel");
		}

		if (!channel.manageable || !channel.isVoiceBased()) {
			throw new Error("Cannot manage channel");
		}

		await channel.permissionOverwrites.create(member, {
			Connect: true,
		});

		if (channel.isTextBased()) {
			await channel.send({
				content: `User ${member.user.toString()} has joined the channel`,
			});
		}

		return member;
	}

	/**
	 *
	 * @param channelId The channel that the user has been declined from
	 * @param userId The user that has been declined from the channel
	 * @returns The user that has been declined from the channel
	 */
	public async declineJoin(
		channelId: string,
		userId: string,
	): Promise<GuildMember> {
		const channel = await this.client.channels.fetch(channelId);

		if (!channel) {
			throw new IntentsError("Client channel");
		}

		if (channel.isDMBased()) {
			throw new Error("Channel is a DM");
		}

		const member = await channel.guild.members.fetch(userId);

		if (channel.isTextBased()) {
			await channel.send({
				content: `User ${member.user.toString()} has been declined to join the channel`,
			});
		}

		return member;
	}

	/**
	 * Transfer ownership of a channel
	 * @param guildId The guild the command occured in
	 * @param channelId The target channel
	 * @param userId The user who wishes to transfer ownership
	 * @param newOwnerId The new owner of the channel
	 * @returns The updated channel
	 */
	public async transfer(
		guildId: string,
		channelId: string,
		userId: string,
		newOwnerId: string,
	) {
		const { discordChannel } = await this.checkChannelControl(
			guildId,
			channelId,
			userId,
		);

		await this.db
			.update(secondaryTable)
			.set({
				creator: newOwnerId,
			})
			.where(
				and(
					eq(secondaryTable.id, channelId),
					eq(secondaryTable.guildId, guildId),
				),
			);

		await this.updateName(guildId, channelId);

		return discordChannel;
	}

	public async pin(guildId: string, channelId: string, userId: string) {
		const { discordChannel } = await this.checkChannelControl(
			guildId,
			channelId,
			userId,
		);

		await this.db
			.update(secondaryTable)
			.set({
				pinned: true,
			})
			.where(
				and(
					eq(secondaryTable.id, channelId),
					eq(secondaryTable.guildId, guildId),
				),
			);

		return discordChannel;
	}

	public async unpin(guildId: string, channelId: string, userId: string) {
		const { discordChannel } = await this.checkChannelControl(
			guildId,
			channelId,
			userId,
		);

		await this.db
			.update(secondaryTable)
			.set({
				pinned: false,
			})
			.where(
				and(
					eq(secondaryTable.id, channelId),
					eq(secondaryTable.guildId, guildId),
				),
			);

		return discordChannel;
	}

	/**
	 * Create a modal to edit a secondary channel
	 * @param guildId the guild id
	 * @param id the id of the secondary channel
	 * @returns the modal builder
	 */
	async createSecondaryModal(
		guildId: string,
		id: string,
	): Promise<ModalBuilder> {
		const secondaryProperties = await this.db.query.secondaryTable.findFirst({
			where: and(
				eq(secondaryTable.id, id),
				eq(secondaryTable.guildId, guildId),
			),
		});

		if (!secondaryProperties) {
			throw new Error("Channel is not a dynamica channel");
		}

		const textInput = new TextInputBuilder()
			.setCustomId("name")
			.setLabel("Name")
			.setStyle(TextInputStyle.Short)
			.setRequired(false);

		if (secondaryProperties.name) {
			textInput.setValue(secondaryProperties.name);
		}

		return new ModalBuilder()
			.setTitle("Edit Secondary Channel")
			.setCustomId(`secondary/modals/${id}`)
			.setComponents([
				new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents([
					textInput,
				]),
			]);
	}

	/**
	 * Create a select menu for the secondary channel transfer
	 * @param guildId The guild id
	 * @param channelId The channel id
	 * @param userId The user id of the user that wants to edit the channel
	 * @returns UserSelectMenuBuilder
	 */
	async createSecondaryTransferSelect(
		guildId: string,
		channelId: string,
		userId: string,
	): Promise<UserSelectMenuBuilder> {
		const { discordChannel } = await this.checkChannelControl(
			guildId,
			channelId,
			userId,
		);

		return new UserSelectMenuBuilder()
			.setCustomId(`secondary/selectors/transfer/${channelId}`)
			.setPlaceholder("Select a new owner for the channel")
			.setMaxValues(1)
			.setMinValues(1);
	}

	/**
	 * Create the components for the secondary channel settings message
	 * @param guildId The guild id
	 * @param channelId The secondary channel id
	 * @returns The components for the secondary channel settings message
	 */
	async createSecondarySettingsComponents(
		guildId: string,
		channelId: string,
	): Promise<Array<ActionRowBuilder<ButtonBuilder>>> {
		const databaseChannel = await this.db.query.secondaryTable.findFirst({
			where: and(
				eq(secondaryTable.id, channelId),
				eq(secondaryTable.guildId, guildId),
			),
			with: {
				guild: true,
			},
		});

		if (!databaseChannel) {
			throw new Error("Channel is not a dynamica channel");
		}

		const lockButton = new ButtonBuilder()
			.setCustomId(`secondary/buttons/lock/${channelId}`)
			.setEmoji("🔒")
			.setLabel("Lock")
			.setStyle(ButtonStyle.Primary);

		const unlockButton = new ButtonBuilder()
			.setCustomId(`secondary/buttons/unlock/${channelId}`)
			.setEmoji("🔓")
			.setLabel("Unlock")
			.setStyle(ButtonStyle.Primary);

		const transferButton = new ButtonBuilder()
			.setCustomId(`secondary/buttons/transfer/${channelId}`)
			.setEmoji("👑")
			.setLabel("Transfer")
			.setStyle(ButtonStyle.Primary);

		const settingsButton = new ButtonBuilder()
			.setCustomId(`secondary/buttons/settings/${channelId}`)
			.setEmoji("⚙️")
			.setLabel("Settings")
			.setStyle(ButtonStyle.Primary);

		const allyourbaseButton = new ButtonBuilder()
			.setCustomId(`secondary/buttons/allyourbase/${channelId}`)
			.setEmoji("👑")
			.setLabel("Take Ownership")
			.setStyle(ButtonStyle.Primary);

		const requestJoin = new ButtonBuilder()
			.setCustomId(`secondary/buttons/requestjoin/${channelId}`)
			.setEmoji("👋")
			.setLabel("Request Join")
			.setStyle(ButtonStyle.Primary)
			.setDisabled(
				!databaseChannel.guild.allowJoinRequests || !databaseChannel.locked,
			);

		const pin = new ButtonBuilder()
			.setCustomId(`secondary/buttons/pin/${channelId}`)
			.setEmoji("📌")
			.setLabel("Pin")
			.setStyle(ButtonStyle.Primary);

		const unpin = new ButtonBuilder()
			.setCustomId(`secondary/buttons/unpin/${channelId}`)
			.setEmoji("📌")
			.setLabel("Unpin")
			.setStyle(ButtonStyle.Primary);

		const buttons: Array<ButtonBuilder> = [
			transferButton,
			settingsButton,
			allyourbaseButton,
		];

		if (databaseChannel.guild.allowJoinRequests) {
			buttons.push(requestJoin);
		}

		if (!databaseChannel.locked) {
			buttons.push(lockButton);
		} else {
			buttons.push(unlockButton);
		}

		if (!databaseChannel.pinned) {
			buttons.push(pin);
		} else {
			buttons.push(unpin);
		}

		// chunk by 5
		const actionRows: Array<ActionRowBuilder<ButtonBuilder>> = [];

		for (let i = 0; i < buttons.length; i += 5) {
			actionRows.push(
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					...buttons.slice(i, i + 5),
				),
			);
		}

		return actionRows;
	}

	/**
	 * Creates the components for the join request sent to the owner of the channel
	 * @param guildId The guild id
	 * @param channelId The channel the user wants to join
	 * @param userId The user that wants to join
	 * @returns The components for the join request
	 */
	private async createSecondaryJoinRequestComponents(
		guildId: string,
		channelId: string,
		userId: string,
	): Promise<ActionRowBuilder<ButtonBuilder>> {
		const databaseChannel = await this.db.query.secondaryTable.findFirst({
			where: and(
				eq(secondaryTable.id, channelId),
				eq(secondaryTable.guildId, guildId),
			),
		});

		if (!databaseChannel) {
			throw new Error("Channel is not a dynamica channel");
		}

		const joinButton = new ButtonBuilder()
			.setCustomId(`secondary/buttons/join/${channelId}/${userId}`)
			.setEmoji("👋")
			.setLabel("Join")
			.setStyle(ButtonStyle.Primary);

		const declineButton = new ButtonBuilder()
			.setCustomId(`secondary/buttons/decline/${channelId}/${userId}`)
			.setEmoji("👎")
			.setLabel("Decline")
			.setStyle(ButtonStyle.Danger);

		return new ActionRowBuilder<ButtonBuilder>().addComponents(
			joinButton,
			declineButton,
		);
	}
}

export class NameUpdateError extends Error {
	constructor() {
		super("Failed to update channel name");
	}
}

export class IntentsError extends Error {
	constructor(intentName: string) {
		super(`Intents error, cannot fetch ${intentName}`);
	}
}
