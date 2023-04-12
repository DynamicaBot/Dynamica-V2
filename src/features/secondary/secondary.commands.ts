import { Injectable, UseInterceptors } from '@nestjs/common';
import {
  PermissionFlagsBits,
  channelMention,
  codeBlock,
  inlineCode,
  userMention,
} from 'discord.js';
import {
  Context,
  Options,
  SlashCommand,
  type SlashCommandContext,
} from 'necord';

import { AllyourbaseDto } from './dto/AllyourbaseDto';
import { BitrateDto } from './dto/BitrateDto';
import { LimitDto } from './dto/LimitDto';
import { LockDto } from './dto/LockDto';
import { NameDto } from './dto/NameDto';
import { TransferDto } from './dto/TransferDto';
import { UnlockDto } from './dto/UnlockDto';
import { SecondaryAutocompleteInterceptor } from './interceptors/secondary.interceptor';
import { SecondaryService } from './secondary.service';

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
      interaction.guildId,
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
  })
  async onBitrate(
    @Context() [interaction]: SlashCommandContext,
    @Options() { bitrate, secondary }: BitrateDto,
  ) {
    try {
      const channel = await this.secondaryService.bitrate(
        interaction.guildId,
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

  @UseInterceptors(SecondaryAutocompleteInterceptor)
  @SlashCommand({
    name: 'name',
    description: 'Set the channel name template',
  })
  async onName(
    @Context() [interaction]: SlashCommandContext,
    @Options() { secondary, name }: NameDto,
  ) {
    try {
      const newChannel = await this.secondaryService.name(
        interaction.guildId,
        secondary,
        name,
        interaction.user.id,
      );
      return interaction.reply({
        ephemeral: true,
        content: `Channel Name Template Updated: ${channelMention(
          newChannel.id,
        )}`,
      });
    } catch (error) {
      return interaction.reply({
        ephemeral: true,
        content: `An Error occured: ${error.message}`,
      });
    }
  }

  @UseInterceptors(SecondaryAutocompleteInterceptor)
  @SlashCommand({
    name: 'limit',
    description: 'Set the channel user limit',
  })
  async onLimit(
    @Context() [interaction]: SlashCommandContext,
    @Options() { secondary, limit }: LimitDto,
  ) {
    try {
      const newChannel = await this.secondaryService.limit(
        interaction.guildId,
        secondary,
        limit,
        interaction.user.id,
      );
      return interaction.reply({
        ephemeral: true,
        content: `Channel User Limit Updated: ${channelMention(newChannel.id)}`,
      });
    } catch (error) {
      return interaction.reply({
        ephemeral: true,
        content: `An Error occured: ${error.message}`,
      });
    }
  }

  @UseInterceptors(SecondaryAutocompleteInterceptor)
  @SlashCommand({
    name: 'lock',
    description: 'Lock a channel',
  })
  async onLock(
    @Context() [interaction]: SlashCommandContext,
    @Options() { secondary }: LockDto,
  ) {
    try {
      const newChannel = await this.secondaryService.lock(
        interaction.guildId,
        secondary,
        interaction.user.id,
      );
      return interaction.reply({
        ephemeral: true,
        content: `Channel Locked: ${channelMention(newChannel.id)}`,
      });
    } catch (error) {
      return interaction.reply({
        ephemeral: true,
        content: `An Error occured: ${error.message}`,
      });
    }
  }

  @UseInterceptors(SecondaryAutocompleteInterceptor)
  @SlashCommand({
    name: 'unlock',
    description: 'Unlock a channel',
  })
  async onUnlock(
    @Context() [interaction]: SlashCommandContext,
    @Options() { secondary }: UnlockDto,
  ) {
    try {
      const newChannel = await this.secondaryService.unlock(
        interaction.guildId,
        secondary,
        interaction.user.id,
      );
      return interaction.reply({
        ephemeral: true,
        content: `Channel Unlocked: ${channelMention(newChannel.id)}`,
      });
    } catch (error) {
      return interaction.reply({
        ephemeral: true,
        content: `An Error occured: ${error.message}`,
      });
    }
  }

  @UseInterceptors(SecondaryAutocompleteInterceptor)
  @SlashCommand({
    name: 'transfer',
    description: 'Transfer ownership of a channel',
    dmPermission: false,
  })
  async onTransfer(
    @Context() [interaction]: SlashCommandContext,
    @Options() { secondary, user }: TransferDto,
  ) {
    try {
      const newChannel = await this.secondaryService.transfer(
        interaction.guildId,
        secondary,
        interaction.user.id,
        user.id,
      );
      return interaction.reply({
        ephemeral: true,
        content: `Channel Ownership Transferred: ${channelMention(
          newChannel.id,
        )}`,
      });
    } catch (error) {
      return interaction.reply({
        ephemeral: true,
        content: `An Error occured: ${error.message}`,
      });
    }
  }
}
