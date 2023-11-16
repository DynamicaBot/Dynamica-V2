import { Inject, Injectable, Logger } from '@nestjs/common';
import { Client, DiscordAPIError } from 'discord.js';
import { eq } from 'drizzle-orm';

import { guild, primary, secondary } from '@/db/schema';
import { MqttService } from '@/features/mqtt';

import { DRIZZLE_TOKEN, type Drizzle } from '../drizzle/drizzle.module';

@Injectable()
export class GuildService {
  public constructor(
    @Inject(DRIZZLE_TOKEN) private readonly db: Drizzle,
    private readonly client: Client,
    private readonly mqtt: MqttService,
  ) {}

  private readonly logger = new Logger(GuildService.name);

  /**
   * Update a guild in the database, if the bot has left the guild, delete it
   * @param id The guild id to update
   */
  public async update(id: string) {
    try {
      await this.client.guilds.fetch(id);
    } catch (error) {
      if (error instanceof DiscordAPIError && error.code === 10004) {
        this.db.delete(guild).where(eq(guild.id, id));
      } else {
        this.logger.error('Failed to fetch channel', error);
        // throw error;
      }
    }
  }

  /**
   * Cleanup guilds that the bot has left
   */
  public async cleanup() {
    const guilds = await this.db.select({ id: guild.id }).from(guild);
    await Promise.allSettled(guilds.map(({ id }) => this.update(id)));
  }

  /**
   * Toggle allow join requests for a guild
   * @param guildId The guild id to toggle allow join requests for
   * @returns The updated guild
   */
  public async allowjoin(guildId: string) {
    // const guild = await this.db.guild.findUnique({
    //   where: {
    //     id: guildId,
    //   },
    // });
    const [dbGuild] = await this.db
      .select({ id: guild.id, allowJoinRequests: guild.allowJoinRequests })
      .from(guild)
      .where(eq(guild.id, guildId));

    if (!dbGuild) {
      throw new Error('Guild not found, please kick and reinvite the bot');
    }

    const [newGuild] = await this.db
      .update(guild)
      .set({
        allowJoinRequests: !dbGuild.allowJoinRequests,
      })
      .where(eq(guild.id, guildId))
      .returning();

    return newGuild;
  }

  public async info(guildId: string) {
    // const guild = await this.db.guild.findUnique({
    //   where: {
    //     id: guildId,
    //   },
    //   include: {
    //     primaryChannels: true,
    //     secondaryChannels: true,
    //   },
    // });

    const [dbGuild] = await this.db
      .select({
        id: guild.id,
        allowJoinRequests: guild.allowJoinRequests,
      })
      .from(guild)
      .where(eq(guild.id, guildId));

    const secondaries = await this.db
      .select({
        id: secondary.id,
      })
      .from(secondary)
      .where(eq(secondary.guildId, guildId));

    const primaries = await this.db
      .select({
        id: primary.id,
      })
      .from(primary)
      .where(eq(primary.guildId, guildId));

    if (!guild) {
      throw new Error('Guild not found');
    }

    return {
      ...dbGuild,
      secondaries,
      primaries,
    };
  }
}
