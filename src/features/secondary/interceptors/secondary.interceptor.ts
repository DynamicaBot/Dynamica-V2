import { Inject, Injectable } from '@nestjs/common';
import { AutocompleteInteraction, CacheType } from 'discord.js';
import { and, eq, like } from 'drizzle-orm';
import { AutocompleteInterceptor } from 'necord';

import { secondary } from '@/db/schema';

import { DRIZZLE_TOKEN, type Drizzle } from '../../drizzle/drizzle.module';

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
      .select({ id: secondary.id })
      .from(secondary)
      .where(
        and(
          eq(secondary.guildId, guildInteraction.id),
          like(secondary.id, `%${value}%`),
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
