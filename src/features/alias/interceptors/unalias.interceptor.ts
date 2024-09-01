import { Inject, Injectable } from "@nestjs/common";
import { AutocompleteInteraction, CacheType } from "discord.js";
import { AutocompleteInterceptor } from "necord";

import { type Drizzle, DRIZZLE_TOKEN } from "@/features/drizzle/drizzle.module";
import { aliasTable } from "@/features/drizzle/schema";
import { and, eq, like } from "drizzle-orm";

@Injectable()
export class UnaliasAutocompleteInterceptor extends AutocompleteInterceptor {
	constructor(@Inject(DRIZZLE_TOKEN) private readonly db: Drizzle) {
		super();
	}

	public async transformOptions(
		interaction: AutocompleteInteraction<CacheType>,
	) {
		const { value } = interaction.options.getFocused(true);
		const guildId = interaction.guildId;

		if (!guildId) {
			return interaction.respond([]);
		}

		const aliases = await this.db
			.select({
				name: aliasTable.activity,
				value: aliasTable.activity,
			})
			.from(aliasTable)
			.where(
				and(
					eq(aliasTable.guildId, guildId),
					like(aliasTable.activity, `%${value}%`),
				),
			);

		return interaction.respond(aliases);
	}
}
