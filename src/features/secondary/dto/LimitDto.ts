import { NumberOption, StringOption } from 'necord';

export class LimitDto {
  @StringOption({
    name: 'secondary',
    description: 'The id of the secondary channel',
    required: true,
    autocomplete: true,
  })
  secondary: string;

  @NumberOption({
    name: 'limit',
    description: 'The limit of users in the secondary channel',
    required: true,
  })
  limit: number;
}
