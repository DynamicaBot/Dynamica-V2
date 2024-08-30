import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { IntentsBitField } from "discord.js";
import { NecordModule } from "necord";

import { AppService } from "./app.service";
import { InfoCommands } from "./commands/info.command";
import { AliasModule } from "./features/alias/alias.module";
import { GuildModule } from "./features/guild/guild.module";
import { MqttModule } from "./features/mqtt/mqtt.module";
import { PrimaryModule } from "./features/primary/primary.module";
import { SecondaryModule } from "./features/secondary/secondary.module";
import { DrizzleModule } from "./features/drizzle/drizzle.module";
import { AppController } from "./app.controller";
import { env } from "./env";
@Module({
	imports: [
		NecordModule.forRoot({
			token: env.TOKEN,
			intents: [
				IntentsBitField.Flags.Guilds,
				IntentsBitField.Flags.GuildVoiceStates,
				IntentsBitField.Flags.GuildPresences,
			],
		}),
		ScheduleModule.forRoot(),
		DrizzleModule,
		SecondaryModule,
		PrimaryModule,
		GuildModule,
		AliasModule,
		MqttModule,
	],
	providers: [AppService, InfoCommands],
	controllers: [AppController],
})
export class AppModule {}
