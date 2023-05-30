import { Injectable, Logger } from '@nestjs/common';
import { OverwriteType, PermissionFlagsBits } from 'discord-api-types/v10';
import {
  ActionRowBuilder,
  ActivityType,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  GuildMember,
  ModalActionRowComponentBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ThreadMemberManager,
  UserSelectMenuBuilder,
} from 'discord.js';
import emojiList from 'emoji-random-list';
import { romanize } from 'romans';

import { MqttService } from '@/features/mqtt';
import { PrismaService } from '@/features/prisma';
import { getPresence } from '@/utils/presence';
import UpdateMode from '@/utils/UpdateMode';

import { KyselyService } from '../kysely';
import { PubSubService } from '../pubsub';

@Injectable()
export class SecondaryService {
  private readonly logger = new Logger(SecondaryService.name);

  public constructor(
    private readonly client: Client,
    private readonly kysely: KyselyService,
    private readonly mqtt: MqttService,
    private readonly pubSub: PubSubService,
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
        await this.kysely
          .deleteFrom('Guild')
          .where('id', '=', guildId)
          .execute();
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
        await this.kysely
          .deleteFrom('Primary')
          .where('id', '=', primaryId)
          .execute();
        return;
      }
    }

    const parent =
      discordPrimary.parent?.type === ChannelType.GuildCategory
        ? discordPrimary.parent
        : undefined;

    const channelName = await this.formatName(primaryId, guildId);

    const newDiscordChannel = await discordGuild.channels.create({
      name: channelName,
      parent,
      type: ChannelType.GuildVoice,
      bitrate: discordPrimary.isVoiceBased()
        ? discordPrimary.bitrate
        : undefined,
    });

    const emoji: string = emojiList.random({
      skintones: false,
      genders: false,
      group: 'smileys-and-emotion,animals-and-nature,food-and-drink',
    })[0];

    const newDatabaseChannel = await this.kysely
      .insertInto('Secondary')
      .values({
        id: newDiscordChannel.id,
        emoji,
        creator: userId,
        lastName: channelName,
        primaryId,
        guildId,
      })
      .returningAll()
      .executeTakeFirst();

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

    const { secondaryCount } = await this.kysely
      .selectFrom('Secondary')
      .select((cb) => cb.fn.countAll<number>().as('secondaryCount'))
      .executeTakeFirst();
    const { primaryCount } = await this.kysely
      .selectFrom('Primary')
      .select((cb) => cb.fn.countAll<number>().as('primaryCount'))
      .executeTakeFirst();

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
        await this.kysely
          .deleteFrom('Secondary')
          .where('id', '=', channelId)
          .execute();
        return;
      }
    }

    if (discordChannel.isDMBased()) {
      return;
    }

    const databaseChannel = await this.kysely
      .selectFrom('Secondary')
      .where('id', '=', channelId)
      .where('guildId', '=', guildId)
      .selectAll()
      .executeTakeFirst();

    const newName = await this.formatName(
      databaseChannel.primaryId,
      guildId,
      channelId,
    );

    if (databaseChannel.lastName !== newName && discordChannel.manageable) {
      await discordChannel.edit({
        name: newName,
      });
      await this.kysely
        .updateTable('Secondary')
        .set({
          lastName: newName,
        })
        .where('id', '=', channelId)
        .where('guildId', '=', guildId)
        .execute();
    }

    return newName;
  }

  /**
   * Updates a secondary channel (delete if empty, update name if not)
   * @param channelId The secondary channel id
   * @returns void
   */
  public async update(guildId: string, channelId: string) {
    const secondaryChannel = await this.kysely
      .selectFrom('Secondary')
      .where('id', '=', channelId)
      .where('guildId', '=', guildId)
      .selectAll()
      .executeTakeFirst();

    if (!secondaryChannel) {
      return;
    }

    let discordChannel = this.client.channels.cache.get(channelId);

    if (!discordChannel) {
      try {
        discordChannel = await this.client.channels.fetch(channelId);
      } catch (error) {
        await this.kysely
          .deleteFrom('Secondary')
          .where('id', '=', channelId)
          .where('guildId', '=', guildId)
          .execute();
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
      const memberIds = discordChannel.members.map((member) => member.id);

      if (!memberIds.includes(secondaryChannel.creator)) {
        await this.kysely
          .updateTable('Secondary')
          .where('guildId', '=', guildId)
          .where('id', '=', channelId)
          .set({
            creator: memberIds[0],
          })
          .execute();
      }

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
        await this.kysely
          .deleteFrom('Primary')
          .where('id', '=', primaryId)
          .where('guildId', '=', guildId)
          .execute();
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

    const databasePrimary = await this.kysely
      .selectFrom('Primary')
      .where('id', '=', primaryId)
      .where('guildId', '=', guildId)
      .selectAll()
      .executeTakeFirst();

    const aliases = await this.kysely
      .selectFrom('Alias')
      .where('guildId', '=', databasePrimary.guildId)
      .selectAll()
      .execute();

    const secondaries = await this.kysely
      .selectFrom('Secondary')
      .where('primaryId', '=', primaryId)
      .where('guildId', '=', guildId)
      .orderBy('createdAt', 'asc')
      .selectAll()
      .execute();

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

    const aliasObject: Record<string, string> = {};

    aliases.forEach(({ alias, activity }) => {
      aliasObject[activity] = alias;
    });

    const aliasedActivities = activityList.map(
      (activity) => aliasObject[activity] ?? activity,
    );

    const databaseSecondary = channelId
      ? await this.kysely
          .selectFrom('Secondary')
          .where('id', '=', channelId)
          .selectAll()
          .executeTakeFirst()
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

    const ownIndex = secondaries.findIndex(
      (secondary) => channelId === secondary.id,
    );

    const channelNumber =
      ownIndex === -1 ? secondaries.length + 1 : ownIndex + 1;

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
    const secondaries = await this.kysely
      .selectFrom('Secondary')
      .selectAll()
      .execute();
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

    const databaseSecondary = await this.kysely
      .selectFrom('Secondary')
      .where('id', '=', channelId)
      .where('guildId', '=', guildId)
      .selectAll()
      .executeTakeFirst();

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

    const updatedSecondary = await this.kysely
      .updateTable('Secondary')
      .set({
        creator: userId,
      })
      .where('id', '=', channelId)
      .where('guildId', '=', guildId)
      .returningAll()
      .executeTakeFirst();

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
    const databaseSecondary = await this.kysely
      .selectFrom('Secondary')
      .where('id', '=', channelId)
      .where('guildId', '=', guildId)
      .selectAll()
      .executeTakeFirst();

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
    const databaseSecondary = await this.kysely
      .selectFrom('Secondary')
      .where('id', '=', channelId)
      .where('guildId', '=', guildId)
      .selectAll()
      .executeTakeFirst();

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
    const databaseSecondary = await this.kysely
      .selectFrom('Secondary')
      .where('id', '=', channelId)
      .where('guildId', '=', guildId)
      .selectAll()
      .executeTakeFirst();

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

    await this.kysely
      .updateTable('Secondary')
      .where('id', '=', channel.id)
      .set({ name })
      .execute();

    await this.updateName(guildId, channelId);

    return channel;
  }

  public async info(guildId: string, channelId: string) {
    const databaseSecondary = await this.kysely
      .selectFrom('Secondary')
      .where('id', '=', channelId)
      .where('guildId', '=', guildId)
      .selectAll()
      .executeTakeFirst();

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
    const databaseSecondary = await this.kysely
      .selectFrom('Secondary')
      .where('id', '=', channelId)
      .where('guildId', '=', guildId)
      .selectAll()
      .executeTakeFirst();

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

    await this.kysely
      .updateTable('Secondary')
      .where('id', '=', channel.id)
      .where('guildId', '=', channel.guildId)
      .set({
        locked: 1,
      })
      .returningAll()
      .execute();

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
    const databaseSecondary = await this.kysely
      .selectFrom('Secondary')
      .where('id', '=', channelId)
      .where('guildId', '=', guildId)
      .selectAll()
      .executeTakeFirst();

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

    await this.kysely
      .updateTable('Secondary')
      .where('id', '=', channel.id)
      .where('guildId', '=', channel.guildId)
      .set({
        locked: 0,
      })
      .execute();

    await this.updateName(guildId, channelId);

    return channel;
  }

  /**
   * Request to join a channel
   * @param guildId The guild id
   * @param channelId The channel the user wishes to join
   * @param userId The user id of the user who wishes to join
   * @returns creator
   */
  public async requestJoin(
    guildId: string,
    channelId: string,
    userId: string,
  ): Promise<GuildMember> {
    const guildSettings = await this.kysely
      .selectFrom('Guild')
      .where('id', '=', guildId)
      .selectAll()
      .executeTakeFirst();

    const databaseSecondary = await this.kysely
      .selectFrom('Secondary')
      .where('id', '=', channelId)
      .where('guildId', '=', guildId)
      .selectAll()
      .executeTakeFirst();

    if (!databaseSecondary) {
      throw new Error('Channel is not a dynamica channel');
    }

    if (!databaseSecondary.locked) {
      throw new Error('Channel is not locked');
    }

    if (!guildSettings) {
      throw new Error('Guild not found');
    }

    if (!guildSettings.allowJoinRequests) {
      throw new Error('Join requests are not allowed');
    }

    let channel = this.client.channels.cache.get(channelId);

    if (!channel) {
      channel = await this.client.channels.fetch(channelId);
    }

    if (channel.isDMBased()) {
      throw new Error('Channel is a DM');
    }

    let member = channel.guild.members.cache.get(userId);

    if (!member) {
      member = await channel.guild.members.fetch(userId);
    }

    if (member.permissionsIn(channel).has(PermissionFlagsBits.Connect)) {
      throw new Error('Already in channel');
    }

    // Send join request to channel creator
    let creator = channel.guild.members.cache.get(databaseSecondary.creator);

    if (!creator) {
      creator = await channel.guild.members.fetch(databaseSecondary.creator);
    }

    const joinRequestComponents =
      await this.createSecondaryJoinRequestComponents(
        guildId,
        channelId,
        userId,
      );

    await creator.send({
      content: `User ${member.user.tag} wants to join your channel ${channel.name} in ${channel.guild.name}`,
      components: [joinRequestComponents],
    });

    return creator;
  }

  /**
   * Accept a join request
   * @param channelId The channel that the user has been accepted into
   * @param userId The user that has been accepted into the channel
   */
  public async acceptJoin(
    channelId: string,
    userId: string,
  ): Promise<GuildMember> {
    let channel = this.client.channels.cache.get(channelId);

    if (!channel) {
      channel = await this.client.channels.fetch(channelId);
    }

    if (channel.isDMBased()) {
      throw new Error('Channel is a DM');
    }

    let member = channel.guild.members.cache.get(userId);

    if (!member) {
      member = await channel.guild.members.fetch(userId);
    }

    if (member.permissionsIn(channel).has(PermissionFlagsBits.Connect)) {
      throw new Error('Already in channel');
    }

    if (!channel.manageable || !channel.isVoiceBased()) {
      throw new Error('Cannot manage channel');
    }

    await channel.permissionOverwrites.create(member, {
      Connect: true,
    });

    if (channel.isTextBased()) {
      await channel.send({
        content: `User ${member.user.toString()} has joined the channel`,
      });
    }

    return member;
  }

  /**
   *
   * @param channelId The channel that the user has been declined from
   * @param userId The user that has been declined from the channel
   * @returns The user that has been declined from the channel
   */
  public async declineJoin(
    channelId: string,
    userId: string,
  ): Promise<GuildMember> {
    let channel = this.client.channels.cache.get(channelId);

    if (!channel) {
      channel = await this.client.channels.fetch(channelId);
    }

    if (channel.isDMBased()) {
      throw new Error('Channel is a DM');
    }

    let member = channel.guild.members.cache.get(userId);

    if (!member) {
      member = await channel.guild.members.fetch(userId);
    }

    if (channel.isTextBased()) {
      await channel.send({
        content: `User ${member.user.toString()} has been declined to join the channel`,
      });
    }

    return member;
  }

  /**
   * Transfer ownership of a channel
   * @param guildId The guild the command occured in
   * @param channelId The target channel
   * @param userId The user who wishes to transfer ownership
   * @param newOwnerId The new owner of the channel
   * @returns The updated channel
   */
  public async transfer(
    guildId: string,
    channelId: string,
    userId: string,
    newOwnerId: string,
  ) {
    const databaseSecondary = await this.kysely
      .selectFrom('Secondary')
      .where('id', '=', channelId)
      .where('guildId', '=', guildId)
      .selectAll()
      .executeTakeFirst();

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

    await this.kysely
      .updateTable('Secondary')
      .where('id', '=', channel.id)
      .set({
        creator: newOwnerId,
      })
      .execute();

    await this.updateName(guildId, channelId);

    return channel;
  }

  /**
   * Create a modal to edit a secondary channel
   * @param guildId the guild id
   * @param id the id of the secondary channel
   * @returns the modal builder
   */
  async createSecondaryModal(
    guildId: string,
    id: string,
  ): Promise<ModalBuilder> {
    const secondaryProperties = await this.kysely
      .selectFrom('Secondary')
      .where('id', '=', id)
      .where('guildId', '=', guildId)
      .selectAll()
      .executeTakeFirst();

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

  /**
   * Create a select menu for the secondary channel transfer
   * @param guildId The guild id
   * @param channelId The channel id
   * @param userId The user id of the user that wants to edit the channel
   * @returns UserSelectMenuBuilder
   */
  async createSecondaryTransferSelect(
    guildId: string,
    channelId: string,
    userId: string,
  ): Promise<UserSelectMenuBuilder> {
    const databaseSecondary = await this.kysely
      .selectFrom('Secondary')
      .where('id', '=', channelId)
      .where('guildId', '=', guildId)
      .selectAll()
      .executeTakeFirst();

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

  /**
   * Create the components for the secondary channel settings message
   * @param guildId The guild id
   * @param channelId The secondary channel id
   * @returns The components for the secondary channel settings message
   */
  async createSecondarySettingsComponents(
    guildId: string,
    channelId: string,
  ): Promise<ActionRowBuilder<ButtonBuilder>> {
    const databaseChannel = await this.kysely
      .selectFrom('Secondary')
      .where('id', '=', channelId)
      .where('guildId', '=', guildId)
      .selectAll()
      .executeTakeFirst();

    const databaseGuild = await this.kysely
      .selectFrom('Guild')
      .where('id', '=', guildId)
      .selectAll()
      .executeTakeFirst();

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

    const requestJoin = new ButtonBuilder()
      .setCustomId(`secondary/buttons/requestjoin/${channelId}`)
      .setEmoji('👋')
      .setLabel('Request Join')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!databaseGuild.allowJoinRequests || !databaseChannel.locked);

    const isLocked = databaseChannel.locked;

    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      transferButton,
      isLocked ? unlockButton : lockButton,
      settingsButton,
      allyourbaseButton,
      requestJoin,
    );
  }

  /**
   * Creates the components for the join request sent to the owner of the channel
   * @param guildId The guild id
   * @param channelId The channel the user wants to join
   * @param userId The user that wants to join
   * @returns The components for the join request
   */
  private async createSecondaryJoinRequestComponents(
    guildId: string,
    channelId: string,
    userId: string,
  ): Promise<ActionRowBuilder<ButtonBuilder>> {
    const databaseChannel = await this.kysely
      .selectFrom('Secondary')
      .where('id', '=', channelId)
      .where('guildId', '=', guildId)
      .selectAll()
      .executeTakeFirst();

    if (!databaseChannel) {
      throw new Error('Channel is not a dynamica channel');
    }

    const joinButton = new ButtonBuilder()
      .setCustomId(`secondary/buttons/join/${channelId}/${userId}`)
      .setEmoji('👋')
      .setLabel('Join')
      .setStyle(ButtonStyle.Primary);

    const declineButton = new ButtonBuilder()
      .setCustomId(`secondary/buttons/decline/${channelId}/${userId}`)
      .setEmoji('👎')
      .setLabel('Decline')
      .setStyle(ButtonStyle.Danger);

    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      joinButton,
      declineButton,
    );
  }
}
