import { Injectable } from '@nestjs/common';
import { AutocompleteInteraction, CacheType } from 'discord.js';
import { AutocompleteInterceptor } from 'necord';

import { PrismaService } from '@/features/prisma';

@Injectable()
export class SecondaryAutocompleteInterceptor extends AutocompleteInterceptor {
  constructor(private readonly db: PrismaService) {
    super();
  }

  public async transformOptions(
    interaction: AutocompleteInteraction<CacheType>,
  ) {
    const { value } = interaction.options.getFocused(true);
    let guildChannels = interaction.guild.channels.cache;
    if (!guildChannels) {
      guildChannels = await interaction.guild.channels.fetch();
    }

    const secondaries = await this.db.secondary.findMany({
      where: {
        guildId: interaction.guildId,
      },
    });

    const mappedSecondaries = secondaries.map(({ id }) =>
      guildChannels.get(id),
    );

    const options = mappedSecondaries.map(({ id, name }) => ({
      name: name,
      value: id,
    }));

    const filteredOptions = options.filter(({ name }) => name.includes(value));

    return interaction.respond(filteredOptions);
  }
}
