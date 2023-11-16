import { channelMention, time } from 'discord.js';

import { primary } from '@/db/schema';

type Primary = typeof primary.$inferSelect;
type Secondary = typeof primary.$inferSelect;

export default function fieldToDiscordEmbed(
  value: string | boolean | Date | Array<Secondary | Primary>,
) {
  if (Array.isArray(value)) {
    return value.length
      ? value.map((item) => channelMention(item.id)).join(', ')
      : 'None';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (value instanceof Date) {
    return time(value);
  }

  return value;
}
