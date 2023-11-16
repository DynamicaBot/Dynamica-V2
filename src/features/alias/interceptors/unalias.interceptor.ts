import { Inject, Injectable } from '@nestjs/common';
import { AutocompleteInteraction, CacheType } from 'discord.js';
import { and, eq, like } from 'drizzle-orm';
import { AutocompleteInterceptor } from 'necord';

import { alias } from '@/db/schema';

import { DRIZZLE_TOKEN, type Drizzle } from '../../drizzle/drizzle.module';

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
        name: alias.activity,
        value: alias.activity,
      })
      .from(alias)
      .where(
        and(eq(alias.guildId, guildId), like(alias.activity, `%${value}%`)),
      );

    return interaction.respond(aliases);
  }
}
