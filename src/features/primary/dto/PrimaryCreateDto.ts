import { ChannelType, type GuildChannel } from "discord.js";
import { ChannelOption } from "necord";

export class PrimaryCreateDto {
	@ChannelOption({
		name: "section",
		description: "Section to create channel under.",
		required: false,
		channel_types: [ChannelType.GuildCategory],
	})
	section?: GuildChannel;
}
