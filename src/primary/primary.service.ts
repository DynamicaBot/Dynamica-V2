import { Injectable } from '@nestjs/common';
import { ChannelType, Client } from 'discord.js';
import { PrismaService } from 'src/prisma/prisma.service';
import { SecondaryService } from 'src/secondary/secondary.service';

@Injectable()
export class PrimaryService {
  public constructor(
    private readonly client: Client,
    private readonly db: PrismaService,
    private readonly secondaryService: SecondaryService,
  ) {}

  public async create(creator: string, guildId: string, sectionId?: string) {
    let guild = await this.client.guilds.fetch(guildId);

    if (!guild) {
      try {
        guild = await this.client.guilds.fetch(guildId);
      } catch (error) {
        await this.db.guild.delete({
          where: {
            id: guildId,
          },
        });
        throw new Error('No access to guild');
      }
    }

    const channelId = await guild.channels.create({
      name: `➕ New Session`,
      type: ChannelType.GuildVoice,
      parent: sectionId,
    });

    const primary = await this.db.primary.create({
      data: {
        id: channelId.id,
        creator,
        guild: {
          connectOrCreate: {
            where: {
              id: guild.id,
            },
            create: {
              id: guild.id,
            },
          },
        },
      },
    });

    return primary;
  }

  /**
   * Update a primary in the database, if the bot has left the guild, delete it
   * @param guildId The guild id to update primaries
   * @param id The primary id to update
   * @returns The updated primary
   */
  public async update(guildId: string, id: string) {
    let primary = this.client.channels.cache.get(id);

    if (!primary) {
      try {
        primary = await this.client.channels.fetch(id);
      } catch (error) {
        await this.db.primary.delete({
          where: {
            id,
          },
        });
        return;
      }
    }

    if (primary.type !== ChannelType.GuildVoice) {
      return;
    }

    const { members } = primary;

    const firstMember = members.first();

    const rest = members.filter((member) => member.id !== firstMember.id);

    if (firstMember) {
      const newChannel = await this.secondaryService.create(
        guildId,
        id,
        firstMember.id,
      );
      await Promise.all(
        rest.map((member) => member.voice.setChannel(newChannel.id)),
      );
    }
  }

  /**
   * Cleanup primaries that are no longer in the guild
   */
  public async cleanup() {
    const primaries = await this.db.primary.findMany();
    await Promise.all(
      primaries.map(({ id, guildId }) => this.update(guildId, id)),
    );
  }

  /**
   * Update secondaries for a primary
   * @param guildId The guild id to update secondaries for
   * @param primaryId The primary id to update secondaries for
   * @returns The updated primary
   */
  public async updateSecondaries(guildId: string, primaryId: string) {
    const databasePrimary = await this.db.primary.findUnique({
      where: {
        guildId_id: {
          guildId,
          id: primaryId,
        },
      },
      include: {
        secondaries: true,
      },
    });

    if (!databasePrimary) {
      throw new Error('No primary found');
    }

    const { secondaries } = databasePrimary;

    await Promise.all(
      secondaries.map(({ id }) => this.secondaryService.update(guildId, id)),
    );

    return databasePrimary;
  }

  /**
   * Update the general template for a primary
   * @param guildId The guild id to update the general template for
   * @param primaryId The primary id to update the general template for
   * @param newTemplate The new general template
   * @returns The updated primary
   */
  public async general(
    guildId: string,
    primaryId: string,
    newTemplate: string,
  ) {
    const databasePrimary = await this.db.primary.findUnique({
      where: {
        guildId_id: {
          guildId,
          id: primaryId,
        },
      },
    });

    if (!databasePrimary) {
      throw new Error('No primary found');
    }

    const updatedPrimary = await this.db.primary.update({
      where: {
        guildId_id: {
          guildId,
          id: primaryId,
        },
      },
      data: {
        generalName: newTemplate,
      },
    });

    await this.updateSecondaries(guildId, primaryId);

    return updatedPrimary;
  }

  /**
   * Update the game template for a primary
   * @param guildId Update the game template for a primary
   * @param primaryId The primary id to update the game template for
   * @param newTemplate The new game template
   * @returns The updated primary
   */
  public async template(guildId: string, primaryId: string, newTemplate: string) {
    const databasePrimary = await this.db.primary.findUnique({
      where: {
        guildId_id: {
          guildId,
          id: primaryId,
        },
      },
    });

    if (!databasePrimary) {
      throw new Error('No primary found');
    }

    const updatedPrimary = await this.db.primary.update({
      where: {
        guildId_id: {
          guildId,
          id: primaryId,
        },
      },
      data: {
        template: newTemplate,
      },
    });

    await this.updateSecondaries(guildId, primaryId);

    return updatedPrimary;
  }
}
