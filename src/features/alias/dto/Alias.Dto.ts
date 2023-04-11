import { ChannelOption, StringOption } from 'necord';
import { ChannelType, GuildChannel } from 'discord.js';

export class AliasDto {
  @StringOption({
    name: 'activity',
    description: 'The activity name to alias',
    autocomplete: true,
    required: true,
  })
  activity: string;

  @StringOption({
    name: 'alias',
    description: 'The alias to remove',
    required: true,
  })
  alias: string;
}
