import { Injectable } from '@nestjs/common';
import { Context, type ContextOf, On } from 'necord';

import { MqttService } from '@/features/mqtt';
import { PrismaService } from '@/features/prisma';
import { getPresence } from '@/utils/presence';
import UpdateMode from '@/utils/UpdateMode';

import { KyselyService } from '../kysely';
import { PubSubService } from '../pubsub';

import { PrimaryService } from './primary.service';

@Injectable()
export class PrimaryEvents {
  constructor(
    private readonly mqtt: MqttService,
    private readonly primaryService: PrimaryService,
    private readonly pubSub: PubSubService,
    private readonly kysely: KyselyService,
  ) {}

  @On('channelDelete')
  public async onChannelDelete(
    @Context() [channel]: ContextOf<'channelDelete'>,
  ) {
    if (channel.isDMBased()) return;

    const databasePrimary = await this.kysely
      .selectFrom('Primary')
      .where('id', '=', channel.id)
      .selectAll()
      .executeTakeFirst();

    if (!databasePrimary) return;

    const deletedPrimary = await this.kysely
      .deleteFrom('Primary')
      .where('id', '=', channel.id)
      .returningAll()
      .executeTakeFirst();
    this.pubSub.publish('primaryUpdate', {
      primaryUpdate: { mode: UpdateMode.Delete, data: deletedPrimary },
    });

    const { primaryCount } = await this.kysely
      .selectFrom('Primary')
      .select((cb) => cb.fn.countAll<number>().as('primaryCount'))
      .executeTakeFirst();
    const { secondaryCount } = await this.kysely
      .selectFrom('Secondary')
      .select((cb) => cb.fn.countAll<number>().as('secondaryCount'))
      .executeTakeFirst();

    channel.client.user.setPresence(getPresence(primaryCount + secondaryCount));

    await this.mqtt.publish(`dynamica/primaries`, primaryCount);
  }
}
