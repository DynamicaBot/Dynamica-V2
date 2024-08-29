import { Inject, Injectable } from "@nestjs/common";
import { EmbedBuilder } from "discord.js";
import { Ctx, Modal, type ModalContext, ModalParam } from "necord";

import type { PrimaryService } from "./primary.service";
import { type Drizzle, DRIZZLE_TOKEN } from "../drizzle/drizzle.module";
import { and, eq } from "drizzle-orm";
import { primaryTable } from "../drizzle/schema";

@Injectable()
export class PrimaryModals {
	constructor(
		@Inject(DRIZZLE_TOKEN) private readonly db: Drizzle,
		private readonly primaryService: PrimaryService,
	) {}

	@Modal("primary/:id")
	public async onPrimaryModal(
		@Ctx() [interaction]: ModalContext,
		@ModalParam("id") id: string,
	) {
		const guildId = interaction.guildId;

		if (!guildId) {
			return interaction.reply({
				ephemeral: true,
				content: "This command can only be used in a server.",
			});
		}

		const primary = await this.db.query.primaryTable.findFirst({
			where: and(eq(primaryTable.id, id), eq(primaryTable.guildId, guildId)),
		});

		if (!primary) {
			throw new Error("Primary not found");
		}

		const newGeneralTemplate = interaction.fields.getTextInputValue("general");
		const newGameTemplate = interaction.fields.getTextInputValue("template");

		const [updatedPrimary] = await this.db
			.update(primaryTable)
			.set({
				generalName: newGeneralTemplate,
				template: newGameTemplate,
			})
			.returning();

		const embed = new EmbedBuilder()
			.setTitle("Primary Updated")
			.setColor("Green")
			.setDescription("Primary updated successfully!")
			.addFields(
				{ name: "General Template", value: updatedPrimary.template },
				{ name: "Game Template", value: updatedPrimary.generalName },
			);

		await this.primaryService.updateSecondaries(guildId, id);

		return interaction.reply({
			ephemeral: true,
			embeds: [embed],
		});
	}
}
