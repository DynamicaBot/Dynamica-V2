import { Injectable } from '@nestjs/common';
import { ChannelType, Client } from 'discord.js';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PrimaryService {
  public constructor(
    private readonly client: Client,
    private readonly db: PrismaService,
  ) {}

  public async create(creator: string, guildId: string, sectionId?: string) {
    let guild = await this.client.guilds.fetch(guildId);

    if (!guild) {
      try {
        guild = await this.client.guilds.fetch(guildId);
      } catch (error) {
        await this.db.guild.delete({
          where: {
            id: guildId,
          },
        });
        throw new Error('No access to guild');
      }
    }

    const channelId = await guild.channels.create({
      name: `➕ New Session`,
      type: ChannelType.GuildVoice,
      parent: sectionId,
    });

    const primary = await this.db.primary.create({
      data: {
        id: channelId.id,
        creator,
        guild: {
          connectOrCreate: {
            where: {
              id: guild.id,
            },
            create: {
              id: guild.id,
            },
          },
        },
      },
    });

    return primary;
  }

  public async update(id: string) {
    let primary = this.client.channels.cache.get(id);

    if (!primary) {
      try {
        primary = await this.client.channels.fetch(id);
      } catch (error) {
        await this.db.primary.delete({
          where: {
            id,
          },
        });
       
      }
    }
  }
}
