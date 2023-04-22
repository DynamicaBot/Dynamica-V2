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
import { MqttModule } from './mqtt/mqtt.module';
import { MqttService } from './mqtt/mqtt.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    NecordModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        token: configService.getOrThrow<string>('TOKEN'),
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
    MqttModule,
  ],
  providers: [AppService, InfoCommands],
})
export class AppModule {}
