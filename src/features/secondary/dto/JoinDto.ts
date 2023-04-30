import { StringOption } from 'necord';

export class JoinDto {
  @StringOption({
    name: 'secondary',
    description: 'The secondary channel to transfer',
    required: true,
    autocomplete: true,
  })
  secondary: string;
}
