import { StringOption } from "necord";

export class AllyourbaseDto {
    @StringOption({
        name: 'secondary',
        description: 'The secondary to take ownership of',
        autocomplete: true,
        required: true
    })
    secondary: string;
}