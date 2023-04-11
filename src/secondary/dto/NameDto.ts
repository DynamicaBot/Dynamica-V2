import { StringOption } from "necord";

export class NameDto {
    @StringOption({
        name: 'secondary',
        description: 'The secondary name to update',
        autocomplete: true,
        required: true
    })
    secondary: string;

    @StringOption({
        name: 'name',
        description: 'The new name for the secondary',
        required: true
    })
    name: string;
}