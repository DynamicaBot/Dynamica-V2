import { UseInterceptors } from "@nestjs/common";
import {
	EmbedBuilder,
	channelMention,
	inlineCode,
	userMention,
} from "discord.js";
import { Context, Options, type SlashCommandContext, Subcommand } from "necord";

import { InfoCommandDecorator } from "@/decorators/info.decorator";
import { PrimaryInfoDto } from "@/dto/PrimaryInfoDto";
import { SecondaryInfoDto } from "@/dto/SecondaryInfoDto";
import { GuildService } from "@/features/guild";
import {
	PrimaryAutocompleteInterceptor,
	PrimaryService,
} from "@/features/primary";
import {
	SecondaryAutocompleteInterceptor,
	SecondaryService,
} from "@/features/secondary";
import fieldToDiscordEmbed from "@/utils/fieldToDiscordEmbed";

@InfoCommandDecorator()
export class InfoCommands {
	constructor(
		private readonly primaryService: PrimaryService,
		private readonly secondaryService: SecondaryService,
		private readonly guildService: GuildService,
	) {}

	@Subcommand({
		name: "guild",
		description: "Get info about the guild",
		dmPermission: false,
	})
	public async onGuild(@Context() [interaction]: SlashCommandContext) {
		const guildInfo = await this.guildService.info(interaction.guildId);
		const embed = new EmbedBuilder()
			.setColor("Blue")
			.setTitle("Guild Info")
			.addFields(
				{
					name: "Allow Join Requests",
					value: fieldToDiscordEmbed(guildInfo.allowJoinRequests),
				},
				{
					name: "Primary Channels",
					value: guildInfo.primaryChannels.length
						? guildInfo.primaryChannels
								.map((channel) => channelMention(channel.id))
								.join("\n")
						: inlineCode(`None`),
				},
				{
					name: "Secondary Channels",
					value: guildInfo.secondaryChannels.length
						? guildInfo.secondaryChannels
								.map((channel) => channelMention(channel.id))
								.join(", ")
						: inlineCode(`None`),
				},
			);
		return interaction.reply({ embeds: [embed], ephemeral: true });
	}

	@UseInterceptors(PrimaryAutocompleteInterceptor)
	@Subcommand({
		name: "primary",
		description: "Get info about the primary channel",
		dmPermission: false,
	})
	public async onPrimary(
		@Context() [interaction]: SlashCommandContext,
		@Options() { primary }: PrimaryInfoDto,
	) {
		const primaryInfo = await this.primaryService.info(
			interaction.guildId,
			primary,
		);

		const embed = new EmbedBuilder()
			.setColor("Blue")
			.setTitle("Primary Info")
			.addFields(
				{ name: "Creator", value: userMention(primaryInfo.creator) },
				{
					name: "Created At",
					value: fieldToDiscordEmbed(primaryInfo.createdAt),
				},
				{
					name: "General Template",
					value: inlineCode(primaryInfo.generalName),
				},
				{
					name: "Activity Template",
					value: inlineCode(primaryInfo.template),
				},
				{
					name: "Secondary Channels",
					value: primaryInfo.secondaries.length
						? primaryInfo.secondaries
								.map((channel) => channelMention(channel.id))
								.join("\n")
						: inlineCode(`None`),
				},
			);
		return interaction.reply({ embeds: [embed], ephemeral: true });
	}

	@UseInterceptors(SecondaryAutocompleteInterceptor)
	@Subcommand({
		name: "secondary",
		description: "Get info about the secondary channel",
		dmPermission: false,
	})
	public async onSecondary(
		@Context() [interaction]: SlashCommandContext,
		@Options() { secondary }: SecondaryInfoDto,
	) {
		const secondaryInfo = await this.secondaryService.info(
			interaction.guildId,
			secondary,
		);

		const embed = new EmbedBuilder()
			.setColor("Blue")
			.setTitle("Secondary Info")
			.addFields(
				{
					name: "Name Override",
					value: secondaryInfo.name.length
						? fieldToDiscordEmbed(secondaryInfo.name)
						: inlineCode(`None`),
				},
				{
					name: "Primary",
					value: channelMention(secondaryInfo.primaryId),
				},
				{
					name: "Creator",
					value: userMention(secondaryInfo.creator),
				},
				{
					name: "Created At",
					value: fieldToDiscordEmbed(secondaryInfo.createdAt),
				},
				{
					name: "Locked",
					value: fieldToDiscordEmbed(secondaryInfo.locked),
				},
			);
		return interaction.reply({ embeds: [embed], ephemeral: true });
	}
}
