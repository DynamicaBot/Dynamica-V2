import { Injectable } from '@nestjs/common';
import { Context, type ContextOf, On } from 'necord';

import { PrismaService } from '@/features/prisma';

import { MixpanelService } from '../mixpanel';

@Injectable()
export class GuildEvents {
  constructor(
    private readonly db: PrismaService,
    private readonly mixpanel: MixpanelService,
  ) {}

  @On('guildCreate')
  public async onGuildCreate(@Context() [guild]: ContextOf<'guildCreate'>) {
    await this.db.guild.create({
      data: {
        id: guild.id,
      },
    });
    await this.mixpanel.track('Guild Joined', {
      distinct_id: guild.id,
    });
  }

  @On('guildDelete')
  public async onGuildDelete(@Context() [guild]: ContextOf<'guildDelete'>) {
    await this.db.guild.delete({
      where: {
        id: guild.id,
      },
    });
    await this.mixpanel.track('Guild Left', {
      distinct_id: guild.id,
    });
  }
}
