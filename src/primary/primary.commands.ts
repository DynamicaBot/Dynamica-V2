import { Inject, Injectable, UseInterceptors } from "@nestjs/common";
import { channelMention } from "discord.js";
import { Context, Options, SlashCommand, type SlashCommandContext } from "necord";
import { PrimaryCreateDto } from "./dto/PrimaryCreateDto";
import { PrimaryService } from "./primary.service";
import { PrimaryAutocompleteInterceptor } from "./interceptors/primary.interceptor";
import { PrimaryGeneralDto } from "./dto/PrimaryGeneralDto";
import { PrimaryTemplateDto } from "./dto/PrimaryTemplateDto";

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

    @UseInterceptors(PrimaryAutocompleteInterceptor)
    @SlashCommand({
        name: "general",
        description: "Set the general channel name template",
        defaultMemberPermissions: "ManageChannels"
    })
    public async onGeneral (@Context() [interaction]: SlashCommandContext, @Options() { primary, template }: PrimaryGeneralDto) {
        try {
            const newChannel = await this.primaryService.general(interaction.guildId, primary, template)
            return interaction.reply({
                ephemeral: true,
                content: `General Channel Name Template Updated: ${channelMention(newChannel.id)}`
            })
        } catch (error) {
            return interaction.reply({
                ephemeral: true,
                content: `An Error occured: ${error.message}`
            })
        }
    }

    @UseInterceptors(PrimaryAutocompleteInterceptor)
    @SlashCommand({
        name: "template",
        description: "Set the channel name template",
        defaultMemberPermissions: "ManageChannels"
    })
    public async onTemplate (@Context() [interaction]: SlashCommandContext, @Options() { primary, template }: PrimaryTemplateDto) {
        try {
            const newChannel = await this.primaryService.template(interaction.guildId, primary, template)
            return interaction.reply({
                ephemeral: true,
                content: `Channel Name Template Updated: ${channelMention(newChannel.id)}`
            })
        } catch (error) {
            return interaction.reply({
                ephemeral: true,
                content: `An Error occured: ${error.message}`
            })
        }
    }
}