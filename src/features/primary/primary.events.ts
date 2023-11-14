import { Inject, Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { Context, type ContextOf, On } from 'necord';

import { primary } from '@/db/schema';
import { MqttService } from '@/features/mqtt';
import { getPresence } from '@/utils/presence';

import { DRIZZLE_TOKEN, type Drizzle } from '../drizzle/drizzle.module';

import { PrimaryService } from './primary.service';

@Injectable()
export class PrimaryEvents {
  constructor(
    @Inject(DRIZZLE_TOKEN) private readonly db: Drizzle,
    private readonly mqtt: MqttService,
    private readonly primaryService: PrimaryService,
  ) {}

  @On('channelDelete')
  public async onChannelDelete(
    @Context() [channel]: ContextOf<'channelDelete'>,
  ) {
    if (channel.isDMBased()) return;

    // const databasePrimary = await this.db.primary.findUnique({
    //   where: {
    //     id: channel.id,
    //   },
    // });
    const [databasePrimary] = await this.db
      .select({ id: primary.id })
      .from(primary)
      .where(eq(primary.id, channel.id));

    if (!databasePrimary) return;

    // await this.db.primary.delete({
    //   where: {
    //     id: channel.id,
    //   },
    // });
    await this.db.delete(primary).where(eq(primary.id, channel.id));

    const [{ primaryCount }] = await this.db
      .select({
        primaryCount: sql<number>`COUNT(*)`,
      })
      .from(primary);

    const [{ secondaryCount }] = await this.db
      .select({
        secondaryCount: sql<number>`COUNT(*)`,
      })
      .from(primary);

    channel.client.user.setPresence(getPresence(primaryCount + secondaryCount));

    await this.mqtt.publish(`dynamica/primaries`, primaryCount);
  }
}
