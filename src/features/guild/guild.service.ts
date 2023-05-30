import { Injectable } from '@nestjs/common';
import { Client } from 'discord.js';

import { MqttService } from '@/features/mqtt';

import { KyselyService } from '../kysely';

@Injectable()
export class GuildService {
  public constructor(
    private readonly kysely: KyselyService,
    private readonly client: Client,
    private readonly mqtt: MqttService,
  ) {}

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
        await this.kysely
          .deleteFrom('Guild')
          .where('id', '=', id)
          .returningAll()
          .execute();
      }
    }
  }

  /**
   * Cleanup guilds that the bot has left
   */
  public async cleanup() {
    const guilds = await this.kysely.selectFrom('Guild').selectAll().execute();
    await Promise.all(guilds.map(({ id }) => this.update(id)));
  }

  /**
   * Toggle allow join requests for a guild
   * @param guildId The guild id to toggle allow join requests for
   * @returns The updated guild
   */
  public async allowjoin(guildId: string) {
    const guild = await this.kysely
      .selectFrom('Guild')
      .where('id', '=', guildId)
      .select('allowJoinRequests')
      .executeTakeFirst();

    const newGuild = await this.kysely
      .insertInto('Guild')
      .values({
        allowJoinRequests: Number(!guild.allowJoinRequests),
      })
      .onConflict((cb) =>
        cb.column('id').doUpdateSet((eb) => ({
          allowJoinRequests: eb.ref('excluded.allowJoinRequests'),
        })),
      )
      .returningAll()
      .executeTakeFirst();

    return newGuild;
  }

  public async info(guildId: string) {
    const guildDetails = await this.kysely
      .selectFrom('Guild')
      .selectAll()
      .where('id', '=', guildId)
      .executeTakeFirst();

    if (!guildDetails) {
      throw new Error('Guild not found');
    }

    const guildSecondaries = await this.kysely
      .selectFrom('Secondary')
      .selectAll()
      .where('guildId', '=', guildId)
      .execute();

    const guildPrimaries = await this.kysely
      .selectFrom('Primary')
      .selectAll()
      .where('guildId', '=', guildId)
      .execute();

    return {
      ...guildDetails,
      secondaries: guildSecondaries,
      primaries: guildPrimaries,
    } as const;
  }
}
