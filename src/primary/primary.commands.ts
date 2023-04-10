import { Inject, Injectable } from "@nestjs/common";
import { channelMention } from "discord.js";
import { Context, Options, SlashCommand, type SlashCommandContext } from "necord";
import { PrimaryCreateDto } from "./dto/PrimaryCreateDto";
import { PrimaryService } from "./primary.service";

@Injectable()
export class PrimaryCommands {
    constructor (private readonly primaryService: PrimaryService) {}

    @SlashCommand({
        name: "create",
        description: "Create a new dynamic channel",
        defaultMemberPermissions: "ManageChannels"
    })
    public async onCreate (@Context() [interaction]: SlashCommandContext, @Options() options: PrimaryCreateDto) {
        const { guildId } = interaction
        try {
            const newChannel = await this.primaryService.create(interaction.user.id,guildId, options.section?.id)
            return interaction.reply({
                ephemeral: true,
                content: `New Primary Channel Created: ${channelMention(newChannel.id)}`
            })
        } catch (error) {
            return interaction.reply({
                ephemeral: true,
                content: `An Error occured: ${error.message}`
            })
        }
        
        
    }
}