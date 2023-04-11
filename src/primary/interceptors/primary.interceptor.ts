import { Injectable } from "@nestjs/common";
import { AutocompleteInteraction, CacheType } from "discord.js";
import { AutocompleteInterceptor } from "necord";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class PrimaryAutocompleteInterceptor extends AutocompleteInterceptor {
    constructor(private readonly db: PrismaService) {
        super();
    }

    public async transformOptions(interaction: AutocompleteInteraction<CacheType>) {
        const { value } = interaction.options.getFocused(true);
        let guildChannels = interaction.guild.channels.cache
        if (!guildChannels) {
            guildChannels = await interaction.guild.channels.fetch()
        }

        const primaries = await this.db.primary.findMany({
            where: {
                guildId: interaction.guildId,
            }
        });

        const mappedSecondaries = primaries.map(({ id }) => guildChannels.get(id))

        const options = mappedSecondaries.map(({ id, name }) => ({
            name: name,
            value: id,
        }));

        const filteredOptions = options.filter(({ name }) => name.includes(value))
     
        return interaction.respond(filteredOptions);
    }
}