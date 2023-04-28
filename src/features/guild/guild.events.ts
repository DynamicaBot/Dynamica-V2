import { Injectable, Logger } from '@nestjs/common';
import { Context, type ContextOf, On } from 'necord';

import { MqttService } from '@/features/mqtt';
import { PrismaService } from '@/features/prisma';
import UpdateMode from '@/utils/UpdateMode';

import { PubSubService } from '../pubsub';

import { GuildService } from './guild.service';

@Injectable()
export class GuildEvents {
  constructor(
    private readonly db: PrismaService,
    private readonly mqtt: MqttService,
    private readonly pubSub: PubSubService,
  ) {}

  private readonly logger = new Logger(GuildEvents.name);

  @On('guildCreate')
  public async onGuildCreate(@Context() [guild]: ContextOf<'guildCreate'>) {
    const createdGuild = await this.db.guild.create({
      data: {
        id: guild.id,
      },
    });
    this.pubSub.publish('guildUpdate', {
      guildUpdate: {
        data: createdGuild,
        mode: UpdateMode.Create,
      },
    });
    const guildCount = await this.db.guild.count();
    this.logger.log(`Joined guild ${guild.name} (${guild.id})`);
    await this.mqtt.publish(`dynamica/guilds`, guildCount);
  }

  @On('guildDelete')
  public async onGuildDelete(@Context() [guild]: ContextOf<'guildDelete'>) {
    const deletedGuild = await this.db.guild.delete({
      where: {
        id: guild.id,
      },
    });
    this.pubSub.publish('guildUpdate', {
      guildUpdate: { data: deletedGuild, mode: UpdateMode.Delete },
    });
    const guildCount = await this.db.guild.count();
    this.logger.log(`Left guild ${guild.name} (${guild.id})`);
    await this.mqtt.publish(`dynamica/guilds`, guildCount);
  }
}
