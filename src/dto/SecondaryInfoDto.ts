import { StringOption } from "necord";

export class SecondaryInfoDto {
	@StringOption({
		name: "secondary",
		description: "The id of the secondary channel",
		required: true,
		autocomplete: true,
	})
	secondary: string;
}
