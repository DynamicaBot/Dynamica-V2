import { Injectable, UseInterceptors } from '@nestjs/common';
import {
  Context,
  Options,
  SlashCommand,
  type SlashCommandContext,
} from 'necord';
import { SecondaryService } from './secondary.service';
import {
  GuildMember,
  PermissionFlagsBits,
  channelMention,
  codeBlock,
  inlineCode,
  userMention,
} from 'discord.js';
import { BitrateDto } from './dto/BitrateDto';
import { SecondaryAutocompleteInterceptor } from './interceptors/secondary.interceptor';
import { AllyourbaseDto } from './dto/AllyourbaseDto';

@UseInterceptors(SecondaryAutocompleteInterceptor)
@Injectable()
export class SecondaryCommands {
  constructor(private readonly secondaryService: SecondaryService) {}

  @UseInterceptors(SecondaryAutocompleteInterceptor)
  @SlashCommand({
    name: 'allyourbase',
    description: 'Are belong to us',
    dmPermission: false,
    defaultMemberPermissions: [PermissionFlagsBits.ManageChannels],
  })
  async allyourbase(
    @Context() [interaction]: SlashCommandContext,
    @Options() { secondary }: AllyourbaseDto,
  ) {
    const newChannel = await this.secondaryService.allyourbase(
      secondary,
      interaction.user.id,
    );

    return interaction.reply({
      content: `${userMention(
        interaction.user.id,
      )} has taken ownership of ${channelMention(newChannel.id)}`,
    });
  }

  @UseInterceptors(SecondaryAutocompleteInterceptor)
  @SlashCommand({
    name: 'bitrate',
    description: 'Change the bitrate of a voice channel',
    dmPermission: false,
    defaultMemberPermissions: [PermissionFlagsBits.ManageChannels],
  })
  async bitrate(
    @Context() [interaction]: SlashCommandContext,
    @Options() { bitrate, secondary }: BitrateDto,
  ) {
    try {
      const channel = await this.secondaryService.bitrate(
        secondary,
        bitrate,
        interaction.user.id,
      );

      return interaction.reply({
        content: `Bitrate of ${channelMention(
          channel.id,
        )} has been set to ${codeBlock(bitrate.toString())}`,
      });
    } catch (error) {
      if (error instanceof Error) {
        return interaction.reply({
          content: `Error: ${inlineCode(error.message)}`,
        });
      } else {
        return interaction.reply({
          content: `Unknown error`,
        });
      }
    }
  }
}
