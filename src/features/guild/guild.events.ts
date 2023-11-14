import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { Context, type ContextOf, On } from 'necord';

import { guild } from '@/db/schema';
import { MqttService } from '@/features/mqtt';

import { DRIZZLE_TOKEN, type Drizzle } from '../drizzle/drizzle.module';

@Injectable()
export class GuildEvents {
  constructor(
    @Inject(DRIZZLE_TOKEN) private readonly db: Drizzle,
    private readonly mqtt: MqttService,
  ) {}

  private readonly logger = new Logger(GuildEvents.name);

  @On('guildCreate')
  public async onGuildCreate(
    @Context() [discordGuild]: ContextOf<'guildCreate'>,
  ) {
    // await this.db.guild.create({
    //   data: {
    //     id: guild.id,
    //   },
    // });
    await this.db
      .insert(guild)
      .values({
        id: discordGuild.id,
        allowJoinRequests: false,
      })
      .execute();

    const [{ guildCount }] = await this.db
      .select({
        guildCount: sql<number>`COUNT(*)`,
      })
      .from(guild);

    this.logger.log(`Joined guild ${discordGuild.name} (${guild.id})`);
    await this.mqtt.publish(`dynamica/guilds`, guildCount);
  }

  @On('guildDelete')
  public async onGuildDelete(
    @Context() [discordGuild]: ContextOf<'guildDelete'>,
  ) {
    await this.db.delete(guild).where(eq(guild.id, discordGuild.id));
    const [{ guildCount }] = await this.db
      .select({
        guildCount: sql<number>`COUNT(*)`,
      })
      .from(guild);

    this.logger.log(`Left guild ${discordGuild.name} (${guild.id})`);
    await this.mqtt.publish(`dynamica/guilds`, guildCount);
  }
}
