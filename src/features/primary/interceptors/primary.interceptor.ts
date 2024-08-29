import { Inject, Injectable } from "@nestjs/common";
import type { AutocompleteInteraction, CacheType } from "discord.js";
import { AutocompleteInterceptor } from "necord";

import { type Drizzle, DRIZZLE_TOKEN } from "@/features/drizzle/drizzle.module";
import { primaryTable } from "@/features/drizzle/schema";
import { and, eq, like } from "drizzle-orm";

@Injectable()
export class PrimaryAutocompleteInterceptor extends AutocompleteInterceptor {
	constructor(@Inject(DRIZZLE_TOKEN) private readonly db: Drizzle) {
		super();
	}

	public async transformOptions(
		interaction: AutocompleteInteraction<CacheType>,
	) {
		const { value } = interaction.options.getFocused(true);

		const guildInteraction = interaction.guild;

		if (!guildInteraction) {
			return interaction.respond([]);
		}

		const guildChannels = await interaction.guild.channels.fetch();

		const primaries = await this.db
			.select({ id: primaryTable.id })
			.from(primaryTable)
			.where(
				and(
					eq(primaryTable.guildId, guildInteraction.id),
					like(primaryTable.id, `%${value}%`),
				),
			);

		const mappedSecondaries = primaries
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
