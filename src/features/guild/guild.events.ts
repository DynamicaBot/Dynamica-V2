import { Injectable, Logger } from '@nestjs/common';
import { Context, type ContextOf, On } from 'necord';

import { MqttService } from '@/features/mqtt';
import { PrismaService } from '@/features/prisma';

@Injectable()
export class GuildEvents {
  constructor(
    private readonly db: PrismaService,
    private readonly mqtt: MqttService,
  ) {}

  private readonly logger = new Logger(GuildEvents.name);

  @On('guildCreate')
  public async onGuildCreate(@Context() [guild]: ContextOf<'guildCreate'>) {
    await this.db.guild.create({
      data: {
        id: guild.id,
      },
    });
    const guildCount = await this.db.guild.count();
    this.logger.log(`Joined guild ${guild.name} (${guild.id})`);
    await this.mqtt.publish(`dynamica/guilds`, guildCount);
  }

  @On('guildDelete')
  public async onGuildDelete(@Context() [guild]: ContextOf<'guildDelete'>) {
    await this.db.guild.delete({
      where: {
        id: guild.id,
      },
    });
    const guildCount = await this.db.guild.count();
    this.logger.log(`Left guild ${guild.name} (${guild.id})`);
    await this.mqtt.publish(`dynamica/guilds`, guildCount);
  }
}
