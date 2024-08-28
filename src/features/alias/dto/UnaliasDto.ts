import { StringOption } from "necord";

export class UnaliasDto {
	@StringOption({
		name: "activity",
		description: "The activity name to alias",
		autocomplete: true,
		required: true,
	})
	activity: string;
}
