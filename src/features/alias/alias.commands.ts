import { Injectable, UseInterceptors } from "@nestjs/common";
import {
	Context,
	Options,
	SlashCommand,
	type SlashCommandContext,
} from "necord";

import createErrorEmbed from "@/utils/createErrorEmbed";

import type { AliasService } from "./alias.service";
import type { AliasDto } from "./dto/Alias.Dto";
import type { UnaliasDto } from "./dto/UnaliasDto";
import { AliasAutocompleteInterceptor } from "./interceptors/alias.interceptor";
import { UnaliasAutocompleteInterceptor } from "./interceptors/unalias.interceptor";

@Injectable()
export class AliasCommands {
	constructor(private readonly aliasService: AliasService) {}

	@UseInterceptors(AliasAutocompleteInterceptor)
	@SlashCommand({
		name: "alias",
		description: "Alias an activity",
		defaultMemberPermissions: ["ManageChannels"],
		dmPermission: false,
	})
	public async alias(
		@Context() [interaction]: SlashCommandContext,
		@Options() { activity, alias }: AliasDto,
	) {
		try {
			const guildId = interaction.guildId;

			if (!guildId) {
				return interaction.reply({
					content: "This command can only be used in a guild",
					ephemeral: true,
				});
			}
			const updatedAlias = await this.aliasService.upsertAlias(
				guildId,
				activity,
				alias,
			);
			return interaction.reply({
				content: `Alias \`${updatedAlias.activity}\` has been set to \`${updatedAlias.alias}\``,
			});
		} catch (error) {
			const errorEmbed = createErrorEmbed(error.message);

			return interaction.reply({
				embeds: [errorEmbed],
				ephemeral: true,
			});
		}
	}

	@UseInterceptors(UnaliasAutocompleteInterceptor)
	@SlashCommand({
		name: "unalias",
		description: "Unalias an activity",
		defaultMemberPermissions: ["ManageChannels"],
		dmPermission: false,
	})
	public async unalias(
		@Context() [interaction]: SlashCommandContext,
		@Options() { activity }: UnaliasDto,
	) {
		try {
			const guildId = interaction.guildId;

			if (!guildId) {
				return interaction.reply({
					content: "This command can only be used in a guild",
					ephemeral: true,
				});
			}

			const deletedAlias = await this.aliasService.deleteAlias(
				guildId,
				activity,
			);
			return interaction.reply({
				content: `Alias \`${deletedAlias.activity}\` has been deleted`,
			});
		} catch (error) {
			const errorEmbed = createErrorEmbed(error.message);

			return interaction.reply({
				embeds: [errorEmbed],
				ephemeral: true,
			});
		}
	}

	@SlashCommand({
		name: "aliases",
		description: "List all aliases",
		dmPermission: false,
	})
	public async aliases(@Context() [interaction]: SlashCommandContext) {
		try {
			const guildId = interaction.guildId;

			if (!guildId) {
				return interaction.reply({
					content: "This command can only be used in a guild",
					ephemeral: true,
				});
			}

			const aliases = await this.aliasService.listAliases(guildId);
			const aliasList = aliases
				.map(({ activity, alias }) => `\`${activity}\` -> \`${alias}\``)
				.join("\n");
			return interaction.reply({
				content: `Aliases:\n${aliasList}`,
				ephemeral: true,
			});
		} catch (error) {
			const errorEmbed = createErrorEmbed(error.message);

			return interaction.reply({
				embeds: [errorEmbed],
				ephemeral: true,
			});
		}
	}
}
