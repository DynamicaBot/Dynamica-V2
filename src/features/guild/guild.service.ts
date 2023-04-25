import { Injectable } from '@nestjs/common';
import { Client } from 'discord.js';
import { PubSub } from 'graphql-subscriptions';

import { MqttService } from '@/features/mqtt';
import { PrismaService } from '@/features/prisma';

@Injectable()
export class GuildService {
  public constructor(
    private readonly db: PrismaService,
    private readonly client: Client,
    private readonly mqtt: MqttService,
  ) {}

  public readonly pubSub = new PubSub();

  /**
   * Update a guild in the database, if the bot has left the guild, delete it
   * @param id The guild id to update
   */
  public async update(id: string) {
    let guild = this.client.guilds.cache.get(id);

    if (!guild) {
      try {
        guild = await this.client.guilds.fetch(id);
      } catch (error) {
        await this.db.guild.delete({
          where: {
            id,
          },
        });
      }
    }
  }

  /**
   * Cleanup guilds that the bot has left
   */
  public async cleanup() {
    const guilds = await this.db.guild.findMany();
    await Promise.all(guilds.map(({ id }) => this.update(id)));
  }

  /**
   * Toggle allow join requests for a guild
   * @param guildId The guild id to toggle allow join requests for
   * @returns The updated guild
   */
  public async allowjoin(guildId: string) {
    const guild = await this.db.guild.findUnique({
      where: {
        id: guildId,
      },
    });

    const newGuild = await this.db.guild.update({
      where: {
        id: guildId,
      },
      data: {
        allowJoinRequests: !guild.allowJoinRequests,
      },
    });

    return newGuild;
  }

  public async info(guildId: string) {
    const guild = await this.db.guild.findUnique({
      where: {
        id: guildId,
      },
      include: {
        primaryChannels: true,
        secondaryChannels: true,
      },
    });

    if (!guild) {
      throw new Error('Guild not found');
    }

    return guild;
  }
}
