import { Injectable } from '@nestjs/common';
import { Context, type ContextOf, On } from 'necord';

import { PrismaService } from '@/features/prisma';

@Injectable()
export class GuildEvents {
  constructor(private readonly db: PrismaService) {}

  @On('guildCreate')
  public async onGuildCreate(@Context() [guild]: ContextOf<'guildCreate'>) {
    await this.db.guild.create({
      data: {
        id: guild.id,
      },
    });
  }

  @On('guildDelete')
  public async onGuildDelete(@Context() [guild]: ContextOf<'guildDelete'>) {
    await this.db.guild.delete({
      where: {
        id: guild.id,
      },
    });
  }
}
