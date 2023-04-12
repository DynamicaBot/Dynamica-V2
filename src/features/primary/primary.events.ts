import { Injectable } from '@nestjs/common';
import { Context, type ContextOf, On } from 'necord';

import { PrismaService } from '@/features/prisma';

import { MixpanelService } from '../mixpanel';

import { PrimaryService } from './primary.service';

@Injectable()
export class PrimaryEvents {
  constructor(
    private readonly db: PrismaService,
    private readonly primaryService: PrimaryService,
    private readonly mixpanel: MixpanelService,
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

    await this.db.primary.delete({
      where: {
        id: channel.id,
      },
    });

    await this.mixpanel.track('Primary Deleted', {
      distinct_id: channel.guild.id,
    });
  }
}
