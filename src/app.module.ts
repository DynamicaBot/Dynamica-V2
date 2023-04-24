import { YogaDriverConfig, YogaDriver } from '@graphql-yoga/nestjs';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ScheduleModule } from '@nestjs/schedule';
import { IntentsBitField } from 'discord.js';
import { NecordModule } from 'necord';

import { AppService } from './app.service';
import { InfoCommands } from './commands/info.command';
import { AliasModule } from './features/alias/alias.module';
import { GuildModule } from './features/guild/guild.module';
import { MqttModule } from './features/mqtt/mqtt.module';
import { PrimaryModule } from './features/primary/primary.module';
import { PrismaModule } from './features/prisma/prisma.module';
import { SecondaryModule } from './features/secondary/secondary.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      // typePaths: ['./**/*.graphql'],
      autoSchemaFile: 'schema.gql',
      introspection: true,
      installSubscriptionHandlers: true,
    }),
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
