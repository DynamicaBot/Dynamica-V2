import { User } from 'discord.js';
import { StringOption, UserOption } from 'necord';

export class TransferDto {
  @StringOption({
    name: 'secondary',
    description: 'The secondary channel to transfer',
    required: true,
    autocomplete: true,
  })
  secondary: string;
  @UserOption({
    name: 'user',
    description: 'The user to transfer ownership to',
    required: true,
  })
  user: User;
}
