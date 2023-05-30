import { Injectable } from '@nestjs/common';
import { AutocompleteInteraction, CacheType } from 'discord.js';
import { AutocompleteInterceptor } from 'necord';

import { KyselyService } from '@/features/kysely';
import { PrismaService } from '@/features/prisma';

@Injectable()
export class UnaliasAutocompleteInterceptor extends AutocompleteInterceptor {
  constructor(private readonly kysely: KyselyService) {
    super();
  }

  public async transformOptions(
    interaction: AutocompleteInteraction<CacheType>,
  ) {
    const { value } = interaction.options.getFocused(true);

    const aliases = await this.kysely
      .selectFrom('Alias')
      .where('guildId', '=', interaction.guildId)
      .where('activity', 'like', value)
      .select('activity')
      .execute();

    const options = aliases.map(({ activity }) => ({
      name: activity,
      value: activity,
    }));

    const filteredOptions = options.filter(({ name }) => name.includes(value));

    return interaction.respond(filteredOptions);
  }
}
