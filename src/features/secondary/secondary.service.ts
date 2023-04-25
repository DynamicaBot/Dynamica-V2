import { Injectable, Logger } from '@nestjs/common';
import { OverwriteType, PermissionFlagsBits } from 'discord-api-types/v10';
import {
  ActionRowBuilder,
  ActivityType,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  ModalActionRowComponentBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ThreadMemberManager,
  UserSelectMenuBuilder,
} from 'discord.js';
import emojiList from 'emoji-random-list';
import { PubSub } from 'graphql-subscriptions';
import { romanize } from 'romans';

import { MqttService } from '@/features/mqtt';
import { PrismaService } from '@/features/prisma';
import { getPresence } from '@/utils/presence';
import UpdateMode from '@/utils/UpdateMode';

@Injectable()
export class SecondaryService {
  private readonly logger = new Logger(SecondaryService.name);

  public readonly pubSub = new PubSub();

  public constructor(
    private readonly client: Client,
    private readonly db: PrismaService,
    private readonly mqtt: MqttService,
  ) {}

  /**
   * Delete a secondary service
   * @param id Channel id to delete
   * @param guildId The guildId to delete from
   */
  public async delete(id: string, guildId: string) {
    let discordGuild = this.client.guilds.cache.get(guildId);

    if (!discordGuild) {
      // TODO: See if this still works with channel delete event
      discordGuild = await this.client.guilds.fetch(guildId);
    }

    let discordChannel = discordGuild.channels.cache.get(id);

    if (!discordChannel) {
      discordChannel = await discordGuild.channels.fetch(id);
    }

    if (discordChannel && discordChannel.manageable) {
      await discordChannel.delete();
    }
  }

  /**
   * Create a secondary channel
   * @param guildId The guild ID
   * @param primaryId The primary channel ID
   * @param userId The user ID
   * @returns The newly created secondary channel
   */
  public async create(guildId: string, primaryId: string, userId: string) {
    let discordGuild = this.client.guilds.cache.get(guildId);

    if (!discordGuild) {
      try {
        discordGuild = await this.client.guilds.fetch(guildId);
      } catch (error) {
        await this.db.guild.delete({
          where: {
            id: guildId,
          },
        });
        return;
      }
    }

    let discordGuildMember = discordGuild.members.cache.get(userId);

    if (!discordGuildMember) {
      discordGuildMember = await discordGuild.members.fetch(userId);
    }

    let discordPrimary = discordGuild.channels.cache.get(primaryId);

    if (!discordPrimary) {
      try {
        discordPrimary = await discordGuild.channels.fetch(primaryId);
      } catch (error) {
        await this.db.primary.delete({
          where: {
            id: primaryId,
          },
        });
        return;
      }
    }

    const parent =
      discordPrimary.parent.type === ChannelType.GuildCategory
        ? discordPrimary.parent
        : undefined;

    const channelName = await this.formatName(primaryId, guildId);

    const newDiscordChannel = await discordGuild.channels.create({
      name: channelName,
      parent,
      type: ChannelType.GuildVoice,
    });

    const emoji: string = emojiList.random({
      skintones: false,
      genders: false,
      group: 'smileys-and-emotion,animals-and-nature,food-and-drink',
    })[0];

    const newDatabaseChannel = await this.db.secondary.create({
      data: {
        id: newDiscordChannel.id,
        emoji,
        creator: userId,
        primary: {
          connect: {
            id: primaryId,
          },
        },
        guild: {
          connect: {
            id: guildId,
          },
        },
      },
    });

    await discordGuildMember.voice.setChannel(newDiscordChannel);

    const channelSettingsComponents =
      await this.createSecondarySettingsComponents(
        guildId,
        newDiscordChannel.id,
      );

    await newDiscordChannel.send({
      content: `Edit the channel settings here`,
      components: [channelSettingsComponents],
    });

    const secondaryCount = await this.db.secondary.count();
    const primaryCount = await this.db.primary.count();

    await this.pubSub.publish('secondaryUpdate', {
      secondaryUpdate: {
        mode: UpdateMode.Create,
        data: newDatabaseChannel,
      },
    });
    this.client.user.setPresence(getPresence(primaryCount + secondaryCount));

    this.mqtt.publish('dynamica/secondaries', secondaryCount.toString());

    return newDatabaseChannel;
  }

  /**
   * Update the name of a secondary channel
   * @param channelId The Id of the channel to update the name of
   * @returns The new name of the channel
   */
  public async updateName(guildId: string, channelId: string) {
    let discordChannel = this.client.channels.cache.get(channelId);

    if (!discordChannel) {
      try {
        discordChannel = await this.client.channels.fetch(channelId);
      } catch (error) {
        await this.db.secondary.delete({
          where: {
            id: channelId,
          },
        });
        return;
      }
    }

    if (discordChannel.isDMBased()) {
      return;
    }

    const databaseChannel = await this.db.secondary.findUnique({
      where: {
        guildId_id: {
          guildId,
          id: channelId,
        },
      },
    });

    const currentName = discordChannel.name;

    const newName = await this.formatName(
      databaseChannel.primaryId,
      guildId,
      channelId,
    );

    if (currentName !== newName) {
      await discordChannel.edit({
        name: newName,
      });
    }

    return newName;
  }

  /**
   * Updates a secondary channel (delete if empty, update name if not)
   * @param channelId The secondary channel id
   * @returns void
   */
  public async update(guildId: string, channelId: string) {
    const secondaryChannel = await this.db.secondary.findUnique({
      where: {
        guildId_id: {
          guildId,
          id: channelId,
        },
      },
    });

    if (!secondaryChannel) {
      return;
    }

    let discordChannel = this.client.channels.cache.get(channelId);

    if (!discordChannel) {
      try {
        discordChannel = await this.client.channels.fetch(channelId);
      } catch (error) {
        await this.db.secondary.delete({
          where: {
            guildId_id: {
              guildId,
              id: channelId,
            },
          },
        });
        return;
      }
    }

    if (
      discordChannel.type === ChannelType.DM ||
      discordChannel.type === ChannelType.GroupDM
    ) {
      return;
    }

    if (discordChannel.members instanceof ThreadMemberManager) {
      return;
    }

    if (discordChannel.members.size === 0) {
      if (discordChannel.manageable) {
        await discordChannel.delete();
      }
    } else {
      await this.updateName(guildId, channelId);
    }
  }

  /**
   * Formats the name of a channel
   * @param primaryId The Id of the primary channel
   * @param guildId The Id of the guild
   * @param channelId The Id of the channel to update the name of (optional)
   * @returns The new name of the channel
   */
  private async formatName(
    primaryId: string,
    guildId: string,
    channelId?: string,
  ) {
    let discordGuild = this.client.guilds.cache.get(guildId);

    if (!discordGuild) {
      try {
        discordGuild = await this.client.guilds.fetch(guildId);
      } catch (error) {
        await this.db.guild.delete({
          where: {
            id: guildId,
          },
        });
        throw new Error('No access to guild');
      }
    }

    let discordChannel = discordGuild.channels.cache.get(
      channelId ?? primaryId,
    );

    if (!discordChannel) {
      discordChannel = await discordGuild.channels.fetch(
        channelId ?? primaryId,
      );
    }

    const databasePrimary = await this.db.primary.findUniqueOrThrow({
      where: {
        id: primaryId,
      },
      include: {
        guild: {
          include: {
            aliases: true,
          },
        },
        secondaries: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (discordChannel.members instanceof ThreadMemberManager) {
      throw new Error('Thread channel');
    }

    const channelMembers = [...discordChannel.members.values()];

    const activities = channelMembers.flatMap(
      (guildMember) => guildMember.presence?.activities ?? [],
    );

    const filteredActivities = activities.filter(
      (activity) =>
        activity.type === ActivityType.Playing ||
        activity.type === ActivityType.Competing,
    );

    const activityList = [
      ...new Set(filteredActivities.map((activity) => activity.name)),
    ];

    const { aliases } = databasePrimary.guild;

    const aliasObject: Record<string, string> = {};

    aliases.forEach(({ alias, activity }) => {
      aliasObject[activity] = alias;
    });

    const aliasedActivities = activityList.map(
      (activity) => aliasObject[activity] ?? activity,
    );

    const databaseSecondary = channelId
      ? await this.db.secondary.findUnique({
          where: {
            id: channelId,
          },
        })
      : undefined;

    const creator = databaseSecondary
      ? discordChannel.members.get(databaseSecondary.creator)
      : discordChannel.members.at(0);

    const creatorName = creator?.displayName ?? 'Unknown';

    const channelNameTemplate =
      databaseSecondary?.name ??
      (activities.length
        ? databasePrimary.template
        : databasePrimary.generalName);

    const locked = databaseSecondary?.locked ?? false;

    const memberCount = channelMembers.length;

    const ownIndex = databasePrimary.secondaries.findIndex(
      (secondary) => channelId === secondary.id,
    );

    const channelNumber =
      ownIndex === -1 ? databasePrimary.secondaries.length + 1 : ownIndex + 1;

    const emoji = databaseSecondary?.emoji ?? '❔';

    const plurals = channelNameTemplate.split(/<<(.+)\/(.+)>>/g);

    const nato = [
      'Alpha',
      'Bravo',
      'Charlie',
      'Delta',
      'Echo',
      'Foxtrot',
      'Golf',
      'Hotel',
      'India',
      'Juliett',
      'Kilo',
      'Lima',
      'Mike',
      'November',
      'Oscar',
      'Papa',
      'Quebec',
      'Romeo',
      'Sierra',
      'Tango',
      'Uniform',
      'Victor',
      'Whiskey',
      'X-ray',
      'Yankee',
      'Zulu',
    ];

    return `${locked ? '🔒 ' : ''}${channelNameTemplate
      .replace(/###/g, channelNumber.toString().padStart(3, '0')) // 001
      .replace(/##/g, `#${channelNumber}`) // #1
      .replace(/\$#/g, channelNumber.toString()) // 1
      .replace(/\+#/g, romanize(channelNumber)) // I
      .replace(/@@nato@@/g, nato[channelNumber - 1]) // Alpha
      .replace(/@@num@@/g, memberCount.toString()) // number of channel members
      .replace(/@@game@@/g, aliasedActivities.join(', ')) // Activities
      .replace(/@@creator@@/g, creatorName) // Creator
      .replace(/@@emoji@@/g, emoji) // Random unicode emoji
      .replace(
        /<<(.+)\/(.+)>>/g,
        memberCount === 1 ? plurals[1] : plurals[2],
      )}`; // Plurals
  }

  public async cleanup() {
    const secondaries = await this.db.secondary.findMany();
    await Promise.all(
      secondaries.map(({ id: secondaryId, guildId }) =>
        this.update(guildId, secondaryId),
      ),
    );
  }

  /**
   * Updates the owner of the secondary channel
   * @param channelId The channel to take ownership of
   * @param userId The user to take ownership of the channel
   * @returns The updated secondary channel
   */
  public async allyourbase(guildId: string, channelId: string, userId: string) {
    let channel = this.client.channels.cache.get(channelId);

    if (!channel) {
      channel = await this.client.channels.fetch(channelId);
    }

    if (channel.type === ChannelType.DM) {
      return;
    }

    const databaseSecondary = await this.db.secondary.findUniqueOrThrow({
      where: {
        guildId_id: {
          guildId,
          id: channelId,
        },
      },
    });

    if (!databaseSecondary) {
      throw new Error('No secondary channel found');
    }

    if (databaseSecondary.creator === userId) {
      throw new Error('You already own this channel');
    }

    let discordGuild = this.client.guilds.cache.get(guildId);

    if (!discordGuild) {
      discordGuild = await this.client.guilds.fetch(guildId);
    }

    const discordMember = await discordGuild.members.fetch(userId);

    if (!discordMember) {
      throw new Error('User not found');
    }

    if (!discordMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
      throw new Error('You do not have permission to do this');
    }

    const updatedSecondary = await this.db.secondary.update({
      where: {
        id: channelId,
      },
      data: {
        creator: userId,
      },
    });

    await this.updateName(guildId, updatedSecondary.id);

    return updatedSecondary;
  }

  /**
   * Updates the bitrate of a dynamica channel
   * @param channelId The dynamic channel to update
   * @param bitrate The bitrate to set the channel to
   * @param userId The user to check if they are the owner of the channel
   * @returns The updated channel
   */
  public async bitrate(
    guildId: string,
    channelId: string,
    bitrate: number,
    userId: string,
  ) {
    const databaseSecondary = await this.db.secondary.findUnique({
      where: {
        guildId_id: {
          guildId,
          id: channelId,
        },
      },
    });

    if (!databaseSecondary) {
      throw new Error('Channel is not a dynamica channel');
    }

    let channel = this.client.channels.cache.get(channelId);

    if (!channel) {
      channel = await this.client.channels.fetch(channelId);
    }

    if (channel.isDMBased()) {
      throw new Error('Channel is a DM');
    }

    if (databaseSecondary.creator !== userId) {
      throw new Error('Not the owner of the channel');
    }

    await channel.edit({ bitrate });

    return channel;
  }

  /**
   * Set a limit on the number of members in a channel
   * @param guildId The guild that the channel is in
   * @param channelId The channel to set the limit on
   * @param limit The limit to set the channel to
   * @param userId The user to check if they are the owner of the channel
   * @returns The updated channel
   */
  public async limit(
    guildId: string,
    channelId: string,
    limit: number,
    userId: string,
  ) {
    const databaseSecondary = await this.db.secondary.findUnique({
      where: {
        guildId_id: {
          guildId,
          id: channelId,
        },
      },
    });

    if (!databaseSecondary) {
      throw new Error('Channel is not a dynamica channel');
    }

    let channel = this.client.channels.cache.get(channelId);

    if (!channel) {
      channel = await this.client.channels.fetch(channelId);
    }

    if (channel.isDMBased()) {
      throw new Error('Channel is a DM');
    }

    if (databaseSecondary.creator !== userId) {
      throw new Error('Not the owner of the channel');
    }

    await channel.edit({ userLimit: limit });

    return channel;
  }

  /**
   *
   * @param guildId The id of the guild to update the channel in
   * @param channelId The id of the channel to update
   * @param name The name to set the channel to
   * @param userId The id of the user to check if they are the owner of the channel
   */
  public async name(
    guildId: string,
    channelId: string,
    name: string | null,
    userId: string,
  ) {
    const databaseSecondary = await this.db.secondary.findUniqueOrThrow({
      where: {
        guildId_id: {
          guildId,
          id: channelId,
        },
      },
    });

    if (!databaseSecondary) {
      throw new Error('Channel is not a dynamica channel');
    }

    let channel = this.client.channels.cache.get(channelId);

    if (!channel) {
      channel = await this.client.channels.fetch(channelId);
    }

    if (channel.isDMBased()) {
      throw new Error('Channel is a DM');
    }

    if (databaseSecondary.creator !== userId) {
      throw new Error('Not the owner of the channel');
    }

    await this.db.secondary.update({
      where: {
        id: channelId,
      },
      data: {
        name,
      },
    });

    await this.updateName(guildId, channelId);

    return channel;
  }

  public async info(guildId: string, channelId: string) {
    const databaseSecondary = await this.db.secondary.findUniqueOrThrow({
      where: {
        guildId_id: {
          guildId,
          id: channelId,
        },
      },
    });

    if (!databaseSecondary) {
      throw new Error('Channel is not a dynamica channel');
    }

    return databaseSecondary;
  }

  /**
   * Locks a channel so that only the people currently in the channel can join
   * @param guildId The id of the guild to update the channel in
   * @param channelId The id of the channel to update
   * @param userId The id of the user to check if they are the owner of the channel
   * @returns The updated channel
   */
  public async lock(guildId: string, channelId: string, userId: string) {
    const databaseSecondary = await this.db.secondary.findUnique({
      where: {
        guildId_id: {
          guildId,
          id: channelId,
        },
      },
    });

    if (!databaseSecondary) {
      throw new Error('Channel is not a dynamica channel');
    }

    let channel = this.client.channels.cache.get(channelId);

    if (!channel) {
      channel = await this.client.channels.fetch(channelId);
    }

    if (!channel) {
      throw new Error('Channel not found');
    }

    if (channel.isDMBased()) {
      throw new Error('Channel is a DM');
    }

    if (databaseSecondary.creator !== userId) {
      throw new Error('Not the owner of the channel');
    }

    const everyoneRole = channel.guild.roles.everyone;

    if (channel.members instanceof ThreadMemberManager) {
      throw new Error('Channel is a thread');
    }

    const currentMembersOfChannel = [...channel.members.values()];

    await channel.edit({
      permissionOverwrites: [
        ...currentMembersOfChannel.map((member) => ({
          id: member.id,
          type: OverwriteType.Member,
          allow: [PermissionFlagsBits.Connect],
        })),
        {
          id: everyoneRole.id,
          type: OverwriteType.Role,
          deny: [PermissionFlagsBits.Connect],
        },
      ],
    });

    await this.db.secondary.update({
      where: {
        guildId_id: {
          guildId,
          id: channelId,
        },
      },
      data: {
        locked: true,
      },
    });

    await this.updateName(guildId, channelId);

    return channel;
  }

  /**
   * Unlock a channel
   * @param guildId Guild id
   * @param channelId Channel id
   * @param userId The user to check if they are the owner of the channel
   * @returns The updated channel
   */
  public async unlock(guildId: string, channelId: string, userId: string) {
    const databaseSecondary = await this.db.secondary.findUnique({
      where: {
        guildId_id: {
          guildId,
          id: channelId,
        },
      },
    });

    if (!databaseSecondary) {
      throw new Error('Channel is not a dynamica channel');
    }

    let channel = this.client.channels.cache.get(channelId);

    if (!channel) {
      channel = await this.client.channels.fetch(channelId);
    }

    if (channel.isDMBased()) {
      throw new Error('Channel is a DM');
    }

    if (databaseSecondary.creator !== userId) {
      throw new Error('Not the owner of the channel');
    }

    await channel.edit({
      permissionOverwrites: null,
    });

    await this.db.secondary.update({
      where: {
        guildId_id: {
          guildId,
          id: channelId,
        },
      },
      data: {
        locked: false,
      },
    });

    await this.updateName(guildId, channelId);

    return channel;
  }

  public async transfer(
    guildId: string,
    channelId: string,
    userId: string,
    newOwnerId: string,
  ) {
    const databaseSecondary = await this.db.secondary.findUnique({
      where: {
        guildId_id: {
          guildId,
          id: channelId,
        },
      },
    });

    if (!databaseSecondary) {
      throw new Error('Channel is not a dynamica channel');
    }

    let channel = this.client.channels.cache.get(channelId);

    if (!channel) {
      channel = await this.client.channels.fetch(channelId);
    }

    if (channel.isDMBased()) {
      throw new Error('Channel is a DM');
    }

    if (databaseSecondary.creator !== userId) {
      throw new Error('Not the owner of the channel');
    }

    await this.db.secondary.update({
      where: {
        guildId_id: {
          guildId,
          id: channelId,
        },
      },
      data: {
        creator: newOwnerId,
      },
    });

    await this.updateName(guildId, channelId);

    return channel;
  }

  async createSecondaryModal(
    guildId: string,
    id: string,
  ): Promise<ModalBuilder> {
    const secondaryProperties = await this.db.secondary.findUnique({
      where: {
        guildId_id: {
          guildId,
          id,
        },
      },
    });

    if (!secondaryProperties) {
      throw new Error('Channel is not a dynamica channel');
    }

    const textInput = new TextInputBuilder()
      .setCustomId('name')
      .setLabel('Name')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    if (secondaryProperties.name) {
      textInput.setValue(secondaryProperties.name);
    }

    return new ModalBuilder()
      .setTitle('Edit Secondary Channel')
      .setCustomId(`secondary/modals/${id}`)
      .setComponents([
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents([
          textInput,
        ]),
      ]);
  }

  async createSecondaryTransferSelect(
    guildId: string,
    channelId: string,
    userId: string,
  ): Promise<UserSelectMenuBuilder> {
    const databaseSecondary = await this.db.secondary.findUnique({
      where: {
        guildId_id: {
          guildId,
          id: channelId,
        },
      },
    });

    if (!databaseSecondary) {
      throw new Error('Channel is not a dynamica channel');
    }

    let channel = this.client.channels.cache.get(channelId);

    if (!channel) {
      channel = await this.client.channels.fetch(channelId);
    }

    if (channel.isDMBased()) {
      throw new Error('Channel is a DM');
    }

    if (databaseSecondary.creator !== userId) {
      throw new Error('Not the owner of the channel');
    }

    return new UserSelectMenuBuilder()
      .setCustomId(`secondary/selectors/transfer/${channelId}`)
      .setPlaceholder('Select a new owner for the channel')
      .setMaxValues(1)
      .setMinValues(1);
  }

  async createSecondarySettingsComponents(
    guildId: string,
    channelId: string,
  ): Promise<ActionRowBuilder<ButtonBuilder>> {
    const databaseChannel = await this.db.secondary.findUnique({
      where: {
        guildId_id: {
          guildId,
          id: channelId,
        },
      },
    });

    if (!databaseChannel) {
      throw new Error('Channel is not a dynamica channel');
    }

    const lockButton = new ButtonBuilder()
      .setCustomId(`secondary/buttons/lock/${channelId}`)
      .setEmoji('🔒')
      .setLabel('Lock')
      .setStyle(ButtonStyle.Primary);

    const unlockButton = new ButtonBuilder()
      .setCustomId(`secondary/buttons/unlock/${channelId}`)
      .setEmoji('🔓')
      .setLabel('Unlock')
      .setStyle(ButtonStyle.Primary);

    const transferButton = new ButtonBuilder()
      .setCustomId(`secondary/buttons/transfer/${channelId}`)
      .setEmoji('👑')
      .setLabel('Transfer')
      .setStyle(ButtonStyle.Primary);

    const settingsButton = new ButtonBuilder()
      .setCustomId(`secondary/buttons/settings/${channelId}`)
      .setEmoji('⚙️')
      .setLabel('Settings')
      .setStyle(ButtonStyle.Primary);

    const allyourbaseButton = new ButtonBuilder()
      .setCustomId(`secondary/buttons/allyourbase/${channelId}`)
      .setEmoji('👑')
      .setLabel('Take Ownership')
      .setStyle(ButtonStyle.Primary);

    const isLocked = databaseChannel.locked;

    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      transferButton,
      isLocked ? unlockButton : lockButton,
      settingsButton,
      allyourbaseButton,
    );
  }
}
