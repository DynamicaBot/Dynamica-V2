import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { IntentsBitField } from 'discord.js';
import { NecordModule } from 'necord';

import { AppService } from './app.service';
import { InfoCommands } from './commands/info.command';
import { AliasModule } from './features/alias/alias.module';
import { GuildModule } from './features/guild/guild.module';
import { PrimaryModule } from './features/primary/primary.module';
import { PrismaModule } from './features/prisma/prisma.module';
import { SecondaryModule } from './features/secondary/secondary.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    NecordModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        token: configService.getOrThrow<string>('DISCORD_BOT_TOKEN'),
        intents: [
          IntentsBitField.Flags.Guilds,
          IntentsBitField.Flags.GuildVoiceStates,
          IntentsBitField.Flags.GuildPresences,
        ],
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    SecondaryModule,
    PrimaryModule,
    GuildModule,
    AliasModule,
  ],
  providers: [AppService, InfoCommands],
})
export class AppModule {}
