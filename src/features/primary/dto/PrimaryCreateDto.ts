import { ChannelOption } from 'necord';
import { ChannelType, GuildChannel } from 'discord.js';

export class PrimaryCreateDto {
  @ChannelOption({
    name: 'section',
    description: 'Section to create channel under.',
    required: false,
    channel_types: [ChannelType.GuildCategory],
  })
  section?: GuildChannel;
}
