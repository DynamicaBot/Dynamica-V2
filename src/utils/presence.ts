import { ActivityType, PresenceData } from 'discord.js';

/**
 * Get the presence data for the bot
 * @param channelCount The total channel count
 * @returns The presence data
 */
export const getPresence = (channelCount: number): PresenceData => ({
  afk: channelCount === 0,
  status: channelCount === 0 ? 'idle' : 'online',
  activities: [
    {
      type: ActivityType.Watching,
      name: `${channelCount} channel${channelCount === 0 ? '' : 's'}`,
    },
  ],
});
