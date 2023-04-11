import { StringOption } from 'necord';

export class PrimaryTemplateDto {
  @StringOption({
    name: 'primary',
    description: 'The id of the primary channel',
    required: true,
    autocomplete: true,
  })
  primary: string;

  @StringOption({
    name: 'template',
    description: 'The template for the game channel name',
    required: true,
  })
  template: string;
}
