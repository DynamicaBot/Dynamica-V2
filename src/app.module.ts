import path from 'path';

import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ScheduleModule } from '@nestjs/schedule';
import { IntentsBitField } from 'discord.js';
import envPaths from 'env-paths';
import { NecordModule } from 'necord';

import { AppService } from './app.service';
import { InfoCommands } from './commands/info.command';
import { AliasModule } from './features/alias/alias.module';
import { GuildModule } from './features/guild/guild.module';
import { MqttModule } from './features/mqtt/mqtt.module';
import { PrimaryModule } from './features/primary/primary.module';
import { PrismaModule } from './features/prisma/prisma.module';
import { PubSubModule } from './features/pubsub';
import { SecondaryModule } from './features/secondary/secondary.module';

@Module({
  imports: [
    PubSubModule,
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      // typePaths: ['./**/*.graphql'],
      useFactory: async (configService: ConfigService) => {
        const tempPath = envPaths('dynamica', { suffix: '' }).temp;
        const logger = new Logger(AppModule.name);
        logger.log(`Temp path: ${tempPath}`);
        return {
          autoSchemaFile: path.join(tempPath, 'schema.gql'),
          introspection: true,
          subscriptions: {
            'graphql-ws': true,
            'subscriptions-transport-ws': true,
          },
          playground: false,
          csrfPrevention: false,
          plugins: [
            ApolloServerPluginLandingPageLocalDefault({
              embed: {
                endpointIsEditable: true,
              },
            }),
          ],
        };
      },
      inject: [ConfigService],
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
