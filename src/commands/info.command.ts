import { Injectable, UseInterceptors } from '@nestjs/common';
import { EmbedBuilder, userMention } from 'discord.js';
import { Context, Options, type SlashCommandContext, Subcommand } from 'necord';

import { InfoCommandDecorator } from '@/decorators/info.decorator';
import { PrimaryInfoDto } from '@/dto/PrimaryInfoDto';
import { SecondaryInfoDto } from '@/dto/SecondaryInfoDto';
import { GuildService } from '@/features/guild';
import {
  PrimaryAutocompleteInterceptor,
  PrimaryService,
} from '@/features/primary';
import {
  SecondaryAutocompleteInterceptor,
  SecondaryService,
} from '@/features/secondary';
import camelCaseToReadable from '@/utils/camelCaseToReadable';
import fieldToDiscordEmbed from '@/utils/fieldToDiscordEmbed';

@InfoCommandDecorator()
export class InfoCommands {
  constructor(
    private readonly primaryService: PrimaryService,
    private readonly secondaryService: SecondaryService,
    private readonly guildService: GuildService,
  ) {}

  @Subcommand({
    name: 'guild',
    description: 'Get info about the guild',
    dmPermission: false,
  })
  public async onGuild(@Context() [interaction]: SlashCommandContext) {
    const guildInfo = await this.guildService.info(interaction.guildId);
    const fields = Object.entries(guildInfo).map(([key, value]) => ({
      name: camelCaseToReadable(key),
      value:
        key === 'creator'
          ? userMention(value as string)
          : fieldToDiscordEmbed(value),
    }));
    const embed = new EmbedBuilder()
      .setColor('Blue')
      .setTitle('Guild Info')
      .addFields(fields);
    return interaction.reply({ embeds: [embed] });
  }

  @UseInterceptors(PrimaryAutocompleteInterceptor)
  @Subcommand({
    name: 'primary',
    description: 'Get info about the primary channel',
    dmPermission: false,
  })
  public async onPrimary(
    @Context() [interaction]: SlashCommandContext,
    @Options() { primary }: PrimaryInfoDto,
  ) {
    const primaryInfo = await this.primaryService.info(
      interaction.guildId,
      primary,
    );
    const fields = Object.entries(primaryInfo).map(([key, value]) => ({
      name: camelCaseToReadable(key),
      value:
        key === 'creator'
          ? userMention(value as string)
          : fieldToDiscordEmbed(value),
    }));
    const embed = new EmbedBuilder()
      .setColor('Blue')
      .setTitle('Primary Info')
      .addFields(fields);
    return interaction.reply({ embeds: [embed] });
  }

  @UseInterceptors(SecondaryAutocompleteInterceptor)
  @Subcommand({
    name: 'secondary',
    description: 'Get info about the secondary channel',
    dmPermission: false,
  })
  public async onSecondary(
    @Context() [interaction]: SlashCommandContext,
    @Options() { secondary }: SecondaryInfoDto,
  ) {
    const secondaryInfo = await this.secondaryService.info(
      interaction.guildId,
      secondary,
    );
    const fields = Object.entries(secondaryInfo).map(([key, value]) => ({
      name: camelCaseToReadable(key),
      value:
        key === 'creator'
          ? userMention(value as string)
          : fieldToDiscordEmbed(value),
    }));
    const embed = new EmbedBuilder()
      .setColor('Blue')
      .setTitle('Secondary Info')
      .addFields(fields);
    return interaction.reply({ embeds: [embed] });
  }
}
