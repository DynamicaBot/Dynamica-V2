import { Injectable } from "@nestjs/common";
import {
	ActivityType,
	AutocompleteInteraction,
	CacheType,
	GuildMember,
} from "discord.js";
import { AutocompleteInterceptor } from "necord";

@Injectable()
export class AliasAutocompleteInterceptor extends AutocompleteInterceptor {
	public async transformOptions(
		interaction: AutocompleteInteraction<CacheType>,
	) {
		const { value } = interaction.options.getFocused(true);

		if (!(interaction.member instanceof GuildMember)) {
			return interaction.respond([
				{
					name: value,
					value: value,
				},
			]);
		}

		const voiceChannel = interaction.member.voice?.channel;

		if (!voiceChannel) {
			return interaction.respond([
				{
					name: value,
					value: value,
				},
			]);
		}

		const channelMembers = [...voiceChannel.members.values()];

		const activities = channelMembers.flatMap(
			(guildMember) => guildMember.presence?.activities ?? [],
		);

		const filteredActivities = activities.filter(
			(activity) =>
				activity.type === ActivityType.Playing ||
				activity.type === ActivityType.Competing,
		);

		const activityList = [
			...new Set(filteredActivities.map((activity) => activity.name)),
		];

		const options = activityList.map((activity) => ({
			name: activity,
			value: activity,
		}));

		const filteredOptions = options.filter(({ name }) => name.includes(value));

		return interaction.respond(filteredOptions);
	}
}
