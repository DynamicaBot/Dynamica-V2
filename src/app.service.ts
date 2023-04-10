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

    const guilds = await this.db.guild.findMany();
    await Promise.all(
      guilds.map( ({ id: guildId }) => this.guildService.update(guildId)),
    );

    const primaries = await this.db.primary.findMany();
    await Promise.all(
      primaries.map(({ id: primaryId }) => this.primaryService.update(primaryId)),
    );

    const secondaries = await this.db.secondary.findMany();
    await Promise.all(secondaries.map((secondary) =>
      this.secondaryService.update(secondary.id),
    ));
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
}
