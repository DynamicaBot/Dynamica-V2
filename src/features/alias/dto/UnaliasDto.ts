import { ChannelOption, StringOption } from 'necord';
import { ChannelType, GuildChannel } from 'discord.js';

export class UnaliasDto {
  @StringOption({
    name: 'activity',
    description: 'The activity name to alias',
    autocomplete: true,
    required: true,
  })
  activity: string;
}
