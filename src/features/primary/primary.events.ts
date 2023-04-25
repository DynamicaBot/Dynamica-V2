import { Injectable } from '@nestjs/common';
import { Context, type ContextOf, On } from 'necord';

import { MqttService } from '@/features/mqtt';
import { PrismaService } from '@/features/prisma';
import { getPresence } from '@/utils/presence';

import { PrimaryService } from './primary.service';

@Injectable()
export class PrimaryEvents {
  constructor(
    private readonly db: PrismaService,
    private readonly mqtt: MqttService,
    private readonly primaryService: PrimaryService,
  ) {}

  @On('channelDelete')
  public async onChannelDelete(
    @Context() [channel]: ContextOf<'channelDelete'>,
  ) {
    if (channel.isDMBased()) return;

    const databasePrimary = await this.db.primary.findUnique({
      where: {
        id: channel.id,
      },
    });

    if (!databasePrimary) return;

    const deletedPrimary = await this.db.primary.delete({
      where: {
        id: channel.id,
      },
    });
    this.primaryService.pubSub.publish('primaryDeleted', {
      primaryDeleted: deletedPrimary,
    });

    const primaryCount = await this.db.primary.count();
    const secondaryCount = await this.db.secondary.count();

    channel.client.user.setPresence(getPresence(primaryCount + secondaryCount));

    await this.mqtt.publish(`dynamica/primaries`, primaryCount);
  }
}
