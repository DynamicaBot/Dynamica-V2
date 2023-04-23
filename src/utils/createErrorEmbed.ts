import { EmbedBuilder, codeBlock } from 'discord.js';

export default function createErrorEmbed(message: string) {
  return new EmbedBuilder()
    .setTitle('Error')
    .setDescription(codeBlock(message))
    .setColor('Red');
}
