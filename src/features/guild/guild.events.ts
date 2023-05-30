import { Injectable, Logger } from '@nestjs/common';
import { Context, type ContextOf, On } from 'necord';

import { MqttService } from '@/features/mqtt';
import UpdateMode from '@/utils/UpdateMode';

import { KyselyService } from '../kysely';
import { PubSubService } from '../pubsub';

import { GuildService } from './guild.service';

@Injectable()
export class GuildEvents {
  constructor(
    private readonly mqtt: MqttService,
    private readonly pubSub: PubSubService,
    private readonly kysely: KyselyService,
  ) {}

  private readonly logger = new Logger(GuildEvents.name);

  @On('guildCreate')
  public async onGuildCreate(@Context() [guild]: ContextOf<'guildCreate'>) {
    const createdGuild = await this.kysely
      .insertInto('Guild')
      .values({
        id: guild.id,
      })
      .returningAll()
      .executeTakeFirst();

    this.pubSub.publish('guildUpdate', {
      guildUpdate: {
        data: createdGuild,
        mode: UpdateMode.Create,
      },
    });

    const { guildCount } = await this.kysely
      .selectFrom('Guild')
      .select((eb) => eb.fn.countAll<number>().as('guildCount'))
      .executeTakeFirst();

    this.logger.log(`Joined guild ${guild.name} (${guild.id})`);
    await this.mqtt.publish(`dynamica/guilds`, guildCount);
  }

  @On('guildDelete')
  public async onGuildDelete(@Context() [guild]: ContextOf<'guildDelete'>) {
    const deletedGuild = await this.kysely
      .deleteFrom('Guild')
      .where('id', '=', guild.id)
      .returningAll()
      .executeTakeFirst();

    this.pubSub.publish('guildUpdate', {
      guildUpdate: { data: deletedGuild, mode: UpdateMode.Delete },
    });

    const { guildCount } = await this.kysely
      .selectFrom('Guild')
      .select((eb) => eb.fn.countAll<number>().as('guildCount'))
      .executeTakeFirst();

    this.logger.log(`Left guild ${guild.name} (${guild.id})`);
    await this.mqtt.publish(`dynamica/guilds`, guildCount);
  }
}
