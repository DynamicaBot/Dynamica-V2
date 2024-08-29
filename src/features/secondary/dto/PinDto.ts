import { StringOption } from "necord";

export class PinDto {
	@StringOption({
		name: "secondary",
		description: "The secondary channel to pin",
		required: true,
		autocomplete: true,
	})
	secondary: string;
}
