import { StringOption } from 'necord';

export class PrimaryDto {
  @StringOption({
    name: 'primary',
    description: 'The id of the primary channel',
    required: true,
    autocomplete: true,
  })
  primary: string;
}
