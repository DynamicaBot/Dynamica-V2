import { Inject, Injectable } from '@nestjs/common';
import { AutocompleteInteraction, CacheType } from 'discord.js';
import { and, eq, like } from 'drizzle-orm';
import { AutocompleteInterceptor } from 'necord';

import { primary } from '@/db/schema';

import { DRIZZLE_TOKEN, type Drizzle } from '../../drizzle/drizzle.module';

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
      .select({ id: primary.id })
      .from(primary)
      .where(
        and(
          eq(primary.guildId, guildInteraction.id),
          like(primary.id, `%${value}%`),
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
