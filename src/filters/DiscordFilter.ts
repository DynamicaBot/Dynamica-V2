import { type ExceptionFilter, Catch, type ArgumentsHost } from "@nestjs/common";
import * as Sentry from "@sentry/node";
import { BaseInteraction } from "discord.js";
import { NecordArgumentsHost } from "necord";

@Catch()
export class DiscordExceptionFilter implements ExceptionFilter {
	public async catch(exception: Error, host: ArgumentsHost) {
		const necordContext = NecordArgumentsHost.create(host).getContext();
		if (!Array.isArray(necordContext)) {
			return console.log(exception);
		}

		const [interaction] = necordContext;

		if (!interaction) {
			return console.log(exception);
		}

		Sentry.captureException(exception);

		if (
			interaction &&
			interaction instanceof BaseInteraction &&
			interaction.isRepliable()
		) {
			return await interaction.reply({
				content: exception.message,
				ephemeral: true,
			});
		}

		return console.log(exception);
	}
}
