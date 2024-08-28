import { StringOption } from "necord";

export class UnlockDto {
	@StringOption({
		name: "channel",
		description: "The secondary channel to unlock",
		autocomplete: true,
		required: true,
	})
	secondary: string;
}
