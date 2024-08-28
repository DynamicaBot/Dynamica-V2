import { StringOption } from "necord";

export class LockDto {
	@StringOption({
		name: "channel",
		description: "The secondary channel to lock",
		autocomplete: true,
		required: true,
	})
	secondary: string;
}
