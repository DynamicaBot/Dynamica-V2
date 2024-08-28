import { Injectable, UseInterceptors } from "@nestjs/common";
import {
	Context,
	Options,
	SlashCommand,
	type SlashCommandContext,
} from "necord";

import createErrorEmbed from "@/utils/createErrorEmbed";

import { AliasService } from "./alias.service";
import { AliasDto } from "./dto/Alias.Dto";
import { UnaliasDto } from "./dto/UnaliasDto";
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
			const updatedAlias = await this.aliasService.upsertAlias(
				interaction.guildId,
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
			const deletedAlias = await this.aliasService.deleteAlias(
				interaction.guildId,
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
			const aliases = await this.aliasService.listAliases(interaction.guildId);
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
