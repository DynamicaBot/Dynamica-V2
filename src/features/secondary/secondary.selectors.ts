import { Injectable } from "@nestjs/common";
import { GuildMember, userMention } from "discord.js";
import {
	Context,
	type ISelectedMembers,
	type ISelectedUsers,
	SelectedMembers,
	SelectedUsers,
	UserSelect,
	type UserSelectContext,
} from "necord";

import createErrorEmbed from "@/utils/createErrorEmbed";

import { SecondaryService } from "./secondary.service";

@Injectable()
export class SecondarySelectors {
	constructor(private readonly secondaryService: SecondaryService) {}

	@UserSelect("secondary/selectors/transfer/:channelId")
	public async onTransfer(
		@Context() [interaction]: UserSelectContext,
		@SelectedUsers() users: ISelectedUsers,
		@SelectedMembers() members: ISelectedMembers,
	) {
		const guildId = interaction.guildId;

		if (!guildId) {
			return interaction.reply({
				ephemeral: true,
				content: "This command can only be used in a guild",
			});
		}
		try {
			const selectedMember = members.first();

			if (!(selectedMember instanceof GuildMember)) {
				return interaction.reply({
					ephemeral: true,
					content: "You must select a member",
				});
			}

			if (!selectedMember) {
				return interaction.reply({
					ephemeral: true,
					content: "You must select a member",
				});
			}

			await this.secondaryService.transfer(
				guildId,
				interaction.channelId,
				interaction.user.id,
				selectedMember.user.id,
			);

			return interaction.update({
				content: `Channel Transferred to ${userMention(
					selectedMember.user.id,
				)}`,
				components: [],
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
