import { StringOption } from "necord";

export class PrimaryGeneralDto {
	@StringOption({
		name: "primary",
		description: "The id of the primary channel",
		required: true,
		autocomplete: true,
	})
	primary: string;

	@StringOption({
		name: "template",
		description: "The template for the general channel name",
		required: true,
	})
	template: string;
}
