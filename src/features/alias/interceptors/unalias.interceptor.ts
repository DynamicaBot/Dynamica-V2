import { Injectable } from "@nestjs/common";
import type { AutocompleteInteraction, CacheType } from "discord.js";
import { AutocompleteInterceptor } from "necord";

import type { PrismaService } from "@/features/prisma";

@Injectable()
export class UnaliasAutocompleteInterceptor extends AutocompleteInterceptor {
	constructor(private readonly db: PrismaService) {
		super();
	}

	public async transformOptions(
		interaction: AutocompleteInteraction<CacheType>,
	) {
		const { value } = interaction.options.getFocused(true);
		const aliases = await this.db.alias.findMany({
			where: {
				guildId: interaction.guildId,
				activity: {
					contains: value,
				},
			},
			select: {
				activity: true,
			},
		});

		const options = aliases.map(({ activity }) => ({
			name: activity,
			value: activity,
		}));

		const filteredOptions = options.filter(({ name }) => name.includes(value));

		return interaction.respond(filteredOptions);
	}
}
