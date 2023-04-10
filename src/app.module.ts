import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { NecordModule } from 'necord';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IntentsBitField } from 'discord.js';
import { PrismaService } from './prisma/prisma.service';
import { PrimaryModule } from './primary/primary.module';
import { SecondaryModule } from './secondary/secondary.module';
import { GuildModule } from './guild/guild.module';
import { AliasModule } from './alias/alias.module';
import { PrismaModule } from './prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';

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
