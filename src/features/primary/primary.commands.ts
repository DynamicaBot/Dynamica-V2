import { Injectable, UseInterceptors } from "@nestjs/common";
import { channelMention } from "discord.js";
import {
	Context,
	Options,
	SlashCommand,
	type SlashCommandContext,
} from "necord";

import createErrorEmbed from "@/utils/createErrorEmbed";

import type { PrimaryCreateDto } from "./dto/PrimaryCreateDto";
import type { PrimaryDto } from "./dto/PrimaryDto";
import { PrimaryAutocompleteInterceptor } from "./interceptors/primary.interceptor";
import { PrimaryService } from "./primary.service";

@Injectable()
export class PrimaryCommands {
	constructor(private readonly primaryService: PrimaryService) {}

	@SlashCommand({
		name: "create",
		description: "Create a new dynamic channel",
		defaultMemberPermissions: "ManageChannels",
	})
	public async onCreate(
		@Context() [interaction]: SlashCommandContext,
		@Options() options: PrimaryCreateDto,
	) {
		const { guildId } = interaction;

		if (!guildId) {
			return interaction.reply({
				content: "This command can only be used in a guild",
				ephemeral: true,
			});
		}

		try {
			const newChannel = await this.primaryService.create(
				interaction.user.id,
				guildId,
				options.section?.id,
			);
			return interaction.reply({
				ephemeral: true,
				content: `New Primary Channel Created: ${channelMention(
					newChannel.id,
				)}`,
			});
		} catch (error) {
			const errorEmbed = createErrorEmbed(error.message);

			return interaction.reply({
				embeds: [errorEmbed],
				ephemeral: true,
			});
		}
	}

	@UseInterceptors(PrimaryAutocompleteInterceptor)
	@SlashCommand({
		name: "primary",
		description: "Set the channel settings",
		defaultMemberPermissions: "ManageChannels",
	})
	public async onSettings(
		@Context() [interaction]: SlashCommandContext,
		@Options() { primary }: PrimaryDto,
	) {
		const guildId = interaction.guildId;

		if (!guildId) {
			return interaction.reply({
				content: "This command can only be used in a guild",
				ephemeral: true,
			});
		}

		try {
			const newChannel = await this.primaryService.createPrimaryModal(
				guildId,
				primary,
			);
			return interaction.showModal(newChannel);
		} catch (error) {
			const errorEmbed = createErrorEmbed(error.message);

			return interaction.reply({
				embeds: [errorEmbed],
				ephemeral: true,
			});
		}
	}
}
