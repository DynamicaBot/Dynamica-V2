import { Inject, Injectable } from "@nestjs/common";
import type { AutocompleteInteraction, CacheType } from "discord.js";
import { AutocompleteInterceptor } from "necord";

import { type Drizzle, DRIZZLE_TOKEN } from "@/features/drizzle/drizzle.module";
import { secondaryTable } from "@/features/drizzle/schema";
import { and, eq, like } from "drizzle-orm";

@Injectable()
export class SecondaryAutocompleteInterceptor extends AutocompleteInterceptor {
	constructor(@Inject(DRIZZLE_TOKEN) private readonly db: Drizzle) {
		super();
	}

	public async transformOptions(
		interaction: AutocompleteInteraction<CacheType>,
	) {
		const guildInteraction = interaction.guild;
		if (!guildInteraction) {
			return interaction.respond([]);
		}

		const { value } = interaction.options.getFocused(true);
		const guildChannels = await interaction.guild.channels.fetch();

		const secondaries = await this.db
			.select({ id: secondaryTable.id })
			.from(secondaryTable)
			.where(
				and(
					eq(secondaryTable.guildId, guildInteraction.id),
					like(secondaryTable.id, `%${value}%`),
				),
			);

		const mappedSecondaries = secondaries
			.map(({ id }) => guildChannels.get(id))
			.filter(nonNullable);

		const options = mappedSecondaries.map(({ id, name }) => ({
			name: name,
			value: id,
		}));

		const filteredOptions = options.filter(({ name }) => name.includes(value));

		return interaction.respond(filteredOptions);
	}
}

function nonNullable<T>(value: T): value is NonNullable<T> {
	return value !== null && value !== undefined;
}
