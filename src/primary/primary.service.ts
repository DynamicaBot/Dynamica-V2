import { Injectable } from '@nestjs/common';
import { ChannelType, Client } from 'discord.js';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PrimaryService {
  public constructor(
    private readonly client: Client,
    private readonly db: PrismaService,
  ) {}

  public async create(guildId: string, sectionId?: string) {
    let guild = await this.client.guilds.fetch(guildId);

    if (!guild) {
      guild = await this.client.guilds.fetch(guildId);
    }

    const channelId = await guild.channels.create({
      name: `➕ New Session`,
      type: ChannelType.GuildVoice,
      parent: sectionId,
    });

    const primary = await this.db.primary.create({
      data: {
        id: channelId.id,
        guild: {
          connectOrCreate: {
            where: {
              id: guild.id
            },
            create: {
              id: guild.id
            },
          },
        },
      },
    });

    return primary;
  }
}
