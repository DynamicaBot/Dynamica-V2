import { Injectable } from "@nestjs/common";
import {
	ActionRowBuilder,
	UserSelectMenuBuilder,
	channelMention,
} from "discord.js";
import { Button, type ButtonContext, ComponentParam, Context } from "necord";

import createErrorEmbed from "@/utils/createErrorEmbed";

import { SecondaryService } from "./secondary.service";

@Injectable()
export class SecondaryButtons {
	constructor(private readonly secondaryService: SecondaryService) {}

	@Button("secondary/buttons/unlock/:id")
	public async onUnlock(
		@Context() [interaction]: ButtonContext,
		@ComponentParam("id") id: string,
	) {
		try {
			await this.secondaryService.unlock(
				interaction.guildId,
				id,
				interaction.user.id,
			);

			const messageComponents =
				await this.secondaryService.createSecondarySettingsComponents(
					interaction.guildId,
					id,
				);

			return interaction.update({
				components: [messageComponents],
			});
		} catch (error) {
			const errorEmbed = createErrorEmbed(error.message);

			return interaction.reply({
				embeds: [errorEmbed],
				ephemeral: true,
			});
		}
	}

	@Button("secondary/buttons/lock/:id")
	public async onLock(
		@Context() [interaction]: ButtonContext,
		@ComponentParam("id") id: string,
	) {
		try {
			await this.secondaryService.lock(
				interaction.guildId,
				id,
				interaction.user.id,
			);
			const messageComponents =
				await this.secondaryService.createSecondarySettingsComponents(
					interaction.guildId,
					id,
				);
			return interaction.update({
				components: [messageComponents],
			});
		} catch (error) {
			const errorEmbed = createErrorEmbed(error.message);

			return interaction.reply({
				embeds: [errorEmbed],
				ephemeral: true,
			});
		}
	}

	@Button("secondary/buttons/transfer/:id")
	public async onTransfer(
		@Context() [interaction]: ButtonContext,
		@ComponentParam("id") id: string,
	) {
		try {
			const selectComponent =
				await this.secondaryService.createSecondaryTransferSelect(
					interaction.guildId,
					id,
					interaction.user.id,
				);

			const row = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
				selectComponent,
			);

			return interaction.reply({
				ephemeral: true,
				content: `Select a user to transfer ownership to`,
				components: [row],
			});
		} catch (error) {
			const errorEmbed = createErrorEmbed(error.message);

			return interaction.reply({
				embeds: [errorEmbed],
				ephemeral: true,
			});
		}
	}

	@Button("secondary/buttons/settings/:id")
	public async onSettings(
		@Context() [interaction]: ButtonContext,
		@ComponentParam("id") id: string,
	) {
		try {
			const modal = await this.secondaryService.createSecondaryModal(
				interaction.guildId,
				id,
			);

			return interaction.showModal(modal);

			// return interaction.update({
			//   components: [messageComponents],
			// });
		} catch (error) {
			const errorEmbed = createErrorEmbed(error.message);

			return interaction.reply({
				embeds: [errorEmbed],
				ephemeral: true,
			});
		}
	}

	@Button("secondary/buttons/allyourbase/:id")
	public async onAllyourbase(
		@Context() [interaction]: ButtonContext,
		@ComponentParam("id") id: string,
	) {
		try {
			await this.secondaryService.allyourbase(
				interaction.guildId,
				id,
				interaction.user.id,
			);

			return interaction.reply({
				content: `All your base are belong to us ${channelMention(id)}`,
			});
		} catch (error) {
			const errorEmbed = createErrorEmbed(error.message);

			return interaction.reply({
				embeds: [errorEmbed],
				ephemeral: true,
			});
		}
	}

	/**
	 * Allow a user to join a channel
	 * @param [interaction] The interaction context
	 * @param channelId The channel to accept the request for
	 * @param userId The user who will be accepted
	 */
	@Button("secondary/buttons/join/:channelId/:userId")
	public async onJoin(
		@Context() [interaction]: ButtonContext,
		@ComponentParam("channelId") channelId: string,
		@ComponentParam("userId") userId: string,
	) {
		try {
			const acceptedMember = await this.secondaryService.acceptJoin(
				channelId,
				userId,
			);

			return interaction.reply({
				content: `Accepted ${acceptedMember.user.username} into channel`,
			});
		} catch (error) {
			const errorEmbed = createErrorEmbed(error.message);

			return interaction.reply({
				embeds: [errorEmbed],
				ephemeral: true,
			});
		}
	}

	@Button("secondary/buttons/decline/:channelId/:userId")
	public async onDecline(
		@Context() [interaction]: ButtonContext,
		@ComponentParam("channelId") channelId: string,
		@ComponentParam("userId") userId: string,
	) {
		try {
			const declinedMember = await this.secondaryService.declineJoin(
				channelId,
				userId,
			);

			return interaction.reply({
				content: `Declined ${declinedMember.user.username} from joining channel`,
			});
		} catch (error) {
			const errorEmbed = createErrorEmbed(error.message);

			return interaction.reply({
				embeds: [errorEmbed],
				ephemeral: true,
			});
		}
	}

	@Button(`secondary/buttons/requestjoin/:channelId`)
	public async onRequestJoin(
		@Context() [interaction]: ButtonContext,
		@ComponentParam("channelId") channelId: string,
	) {
		try {
			const requestedMember = await this.secondaryService.requestJoin(
				interaction.guildId,
				channelId,
				interaction.user.id,
			);

			return interaction.reply({
				content: `Requested to join ${requestedMember.toString()}'s channel`,
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
