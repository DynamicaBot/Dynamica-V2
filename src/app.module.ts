import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { NecordModule } from 'necord';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IntentsBitField } from 'discord.js';
import { PrismaModule } from './features/prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SecondaryModule } from './features/secondary/secondary.module';
import { PrimaryModule } from './features/primary/primary.module';
import { GuildModule } from './features/guild/guild.module';
import { AliasModule } from './features/alias/alias.module';

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
  providers: [AppService],
})
export class AppModule {}
