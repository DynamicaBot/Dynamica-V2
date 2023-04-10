import { Injectable, Logger } from '@nestjs/common';
import {
  ActivityType,
  ChannelType,
  Client,
  ThreadMemberManager,
} from 'discord.js';
import { PrismaService } from 'src/prisma/prisma.service';
import { romanize } from 'romans';
import emojiList from 'emoji-random-list';

@Injectable()
export class SecondaryService {
  private readonly logger = new Logger(SecondaryService.name);

  public constructor(
    private readonly client: Client,
    private readonly db: PrismaService,
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

    return newDatabaseChannel;
  }

  /**
   * Update the name of a secondary channel
   * @param channelId The Id of the channel to update the name of
   * @returns The new name of the channel
   */
  public async updateName(channelId: string) {
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

    if (
      discordChannel.type === ChannelType.DM ||
      discordChannel.type === ChannelType.GroupDM
    ) {
      return;
    }

    const databaseChannel = await this.db.secondary.findUnique({
      where: {
        id: channelId,
      },
    });

    const currentName = discordChannel.name;

    const newName = await this.formatName(
      databaseChannel.primaryId,
      databaseChannel.guildId,
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
  public async update(channelId: string) {
    const secondaryChannel = await this.db.secondary.findUnique({
      where: {
        id: channelId,
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
            id: channelId,
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
      await this.updateName(channelId);
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
      (guildMember) => guildMember.presence.activities,
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

    const gameTemplate = databaseSecondary?.name ?? databasePrimary.template;

    const channelNameTemplate = activities.length
      ? gameTemplate
      : databasePrimary.generalName;

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
      secondaries.map(({ id: secondaryId }) => this.update(secondaryId)),
    );
  }
}
