import { StringOption } from "necord";

export class UnpinDto {
	@StringOption({
		name: "secondary",
		description: "The secondary channel to unpin",
		required: true,
		autocomplete: true,
	})
	secondary: string;
}
