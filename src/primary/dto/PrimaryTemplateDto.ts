import { ChannelOption, StringOption} from 'necord'
import { ChannelType, GuildChannel} from "discord.js"

export class PrimaryTemplateDto {
    @StringOption({
        name: "primary",
        description: "The id of the primary channel",
        required: true,
        autocomplete: true
    })
    primary: string

    @StringOption({
        name: "template",
        description: "The template for the game channel name",
        required: true
    })
    template: string
}