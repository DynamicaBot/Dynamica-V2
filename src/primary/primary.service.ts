import { Injectable } from '@nestjs/common';
import { ChannelType, Client } from 'discord.js';
import { PrismaService } from 'src/prisma/prisma.service';
import { SecondaryService } from 'src/secondary/secondary.service';

@Injectable()
export class PrimaryService {
  public constructor(
    private readonly client: Client,
    private readonly db: PrismaService,
    private readonly secondaryService: SecondaryService,
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
        return;
      }
    }

    if (primary.type !== ChannelType.GuildVoice) {
      return;
    }

    const { members } = primary;

    const firstMember = members.first();

    const rest = members.filter((member) => member.id !== firstMember.id);

    if (firstMember) {
      const newChannel = await this.secondaryService.create(
        primary.guildId,
        primary.id,
        firstMember.id,
      );
      await Promise.all(
        rest.map((member) => member.voice.setChannel(newChannel.id)),
      );
    }
  }

  public async cleanup() {
    const primaries = await this.db.primary.findMany();
    await Promise.all(primaries.map(({ id }) => this.update(id)));
  }
}
