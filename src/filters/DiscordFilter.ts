import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { BaseInteraction } from 'discord.js';
import { NecordArgumentsHost } from 'necord';

@Catch()
export class DiscordExceptionFilter implements ExceptionFilter {
  public async catch(exception: Error, host: ArgumentsHost) {
    const [interaction] = NecordArgumentsHost.create(host).getContext();

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
