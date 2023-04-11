import { Inject, Injectable } from '@nestjs/common';
import { Context, type ContextOf, On } from 'necord';
import { PrismaService } from '@/features/prisma';
import { PrimaryService } from './primary.service';

@Injectable()
export class PrimaryEvents {
  constructor(
    private readonly db: PrismaService,
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

    await this.db.primary.delete({
      where: {
        id: channel.id,
      },
    });
  }
}
