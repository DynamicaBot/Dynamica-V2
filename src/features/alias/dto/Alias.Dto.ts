import { StringOption } from 'necord';

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
