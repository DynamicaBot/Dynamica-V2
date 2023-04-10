import { Injectable, Logger } from '@nestjs/common';
import {
  Context,
  type ContextOf,
  On,
  Once,
  SlashCommand,
  type SlashCommandContext,
} from 'necord';
import { PrismaService } from './prisma/prisma.service';
import { SecondaryService } from './secondary/secondary.service';
import { PrimaryService } from './primary/primary.service';
import { GuildService } from './guild/guild.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  constructor(
    private readonly db: PrismaService,
    private readonly secondaryService: SecondaryService,
    private readonly primaryService: PrimaryService,
    private readonly guildService: GuildService,
  ) {}

  @Once('ready')
  public async onReady(@Context() [client]: ContextOf<'ready'>) {
    this.logger.log(`Bot logged in as ${client.user.tag}`);

    this.cleanup();
  }

  @On('warn')
  public onWarn(@Context() [message]: ContextOf<'warn'>) {
    this.logger.warn(message);
  }

  @SlashCommand({
    name: 'ping',
    description: 'Ping the bot',
  })
  public onPing(@Context() [interaction]: SlashCommandContext) {
    return interaction.reply({
      content: `Pong from JavaScript! Bot Latency ${Math.round(
        interaction.client.ws.ping,
      )}ms.`,
      ephemeral: true,
    });
  }

  @Cron('0 0 * * *')
  public async cleanup() {
    await this.guildService.cleanup();

    await this.primaryService.cleanup();

    await this.secondaryService.cleanup();
  }
}
