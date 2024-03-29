import { Injectable, UseInterceptors } from '@nestjs/common';
import {
  PermissionFlagsBits,
  channelMention,
  codeBlock,
  userMention,
} from 'discord.js';
import {
  Context,
  Options,
  SlashCommand,
  type SlashCommandContext,
} from 'necord';

import createErrorEmbed from '@/utils/createErrorEmbed';

import { AllyourbaseDto } from './dto/AllyourbaseDto';
import { BitrateDto } from './dto/BitrateDto';
import { JoinDto } from './dto/JoinDto';
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
    try {
      const guildId = interaction.guildId;

      if (!guildId) {
        return interaction.reply({
          content: 'This command can only be used in a guild',
          ephemeral: true,
        });
      }

      const newChannel = await this.secondaryService.allyourbase(
        guildId,
        secondary,
        interaction.user.id,
      );

      return interaction.reply({
        content: `${userMention(
          interaction.user.id,
        )} has taken ownership of ${channelMention(newChannel.id)}`,
      });
    } catch (error) {
      const errorEmbed = createErrorEmbed(error.message);

      return interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true,
      });
    }
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
      const guildId = interaction.guildId;

      if (!guildId) {
        return interaction.reply({
          content: 'This command can only be used in a guild',
          ephemeral: true,
        });
      }

      const channel = await this.secondaryService.bitrate(
        guildId,
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
      const errorEmbed = createErrorEmbed(error.message);

      return interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true,
      });
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
      const guildId = interaction.guildId;

      if (!guildId) {
        return interaction.reply({
          content: 'This command can only be used in a guild',
          ephemeral: true,
        });
      }

      const newChannel = await this.secondaryService.name(
        guildId,
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
      const errorEmbed = createErrorEmbed(error.message);

      return interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true,
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
      const guildId = interaction.guildId;

      if (!guildId) {
        return interaction.reply({
          content: 'This command can only be used in a guild',
          ephemeral: true,
        });
      }

      const newChannel = await this.secondaryService.limit(
        guildId,
        secondary,
        limit,
        interaction.user.id,
      );
      return interaction.reply({
        ephemeral: true,
        content: `Channel User Limit Updated: ${channelMention(newChannel.id)}`,
      });
    } catch (error) {
      const errorEmbed = createErrorEmbed(error.message);

      return interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true,
      });
    }
  }

  // TODO: Migrate to button in channel chat
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
      const guildId = interaction.guildId;

      if (!guildId) {
        return interaction.reply({
          content: 'This command can only be used in a guild',
          ephemeral: true,
        });
      }

      const newChannel = await this.secondaryService.lock(
        guildId,
        secondary,
        interaction.user.id,
      );
      return interaction.reply({
        ephemeral: true,
        content: `Channel Locked: ${channelMention(newChannel.id)}`,
      });
    } catch (error) {
      const errorEmbed = createErrorEmbed(error.message);

      return interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true,
      });
    }
  }

  // TODO: Migrate to button in channel chat
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
      const guildId = interaction.guildId;

      if (!guildId) {
        return interaction.reply({
          content: 'This command can only be used in a guild',
          ephemeral: true,
        });
      }

      const newChannel = await this.secondaryService.unlock(
        guildId,
        secondary,
        interaction.user.id,
      );
      return interaction.reply({
        ephemeral: true,
        content: `Channel Unlocked: ${channelMention(newChannel.id)}`,
      });
    } catch (error) {
      const errorEmbed = createErrorEmbed(error.message);

      return interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true,
      });
    }
  }

  // TODO: Migrate to button in channel chat
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
      const guildId = interaction.guildId;

      if (!guildId) {
        return interaction.reply({
          content: 'This command can only be used in a guild',
          ephemeral: true,
        });
      }

      const newChannel = await this.secondaryService.transfer(
        guildId,
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
      const errorEmbed = createErrorEmbed(error.message);

      return interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true,
      });
    }
  }

  @UseInterceptors(SecondaryAutocompleteInterceptor)
  @SlashCommand({
    name: 'join',
    description: 'Join a voice channel',
    dmPermission: false,
  })
  async onJoin(
    @Context() [interaction]: SlashCommandContext,
    @Options() { secondary }: JoinDto,
  ) {
    try {
      const guildId = interaction.guildId;

      if (!guildId) {
        return interaction.reply({
          content: 'This command can only be used in a guild',
          ephemeral: true,
        });
      }

      const creator = await this.secondaryService.requestJoin(
        guildId,
        secondary,
        interaction.user.id,
      );
      return interaction.reply({
        ephemeral: true,
        content: `Join request sent to ${creator.toString()}`,
      });
    } catch (error) {
      const errorEmbed = createErrorEmbed(error.message);

      return interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true,
      });
    }
  }
}
