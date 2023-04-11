import { Injectable, UseInterceptors } from '@nestjs/common';
import {
  Context,
  Options,
  SlashCommand,
  type SlashCommandContext,
} from 'necord';
import { AliasDto } from './dto/Alias.Dto';
import { UnaliasDto } from './dto/UnaliasDto';
import { UnaliasAutocompleteInterceptor } from './interceptors/unalias.interceptor';
import { AliasAutocompleteInterceptor } from './interceptors/alias.interceptor';
import { AliasService } from './alias.service';

@Injectable()
export class AliasCommands {
  constructor(private readonly aliasService: AliasService) {}

  @UseInterceptors(AliasAutocompleteInterceptor)
  @SlashCommand({
    name: 'alias',
    description: 'Alias an activity',
    defaultMemberPermissions: ['ManageChannels'],
    dmPermission: false,
  })
  public async alias(
    @Context() [interaction]: SlashCommandContext,
    @Options() { activity, alias }: AliasDto,
  ) {
    const updatedAlias = await this.aliasService.upsertAlias(
      interaction.guildId,
      activity,
      alias,
    );
    return interaction.reply({
      content: `Alias \`${updatedAlias.activity}\` has been set to \`${updatedAlias.alias}\``,
    });
  }

  @UseInterceptors(UnaliasAutocompleteInterceptor)
  @SlashCommand({
    name: 'unalias',
    description: 'Unalias an activity',
    defaultMemberPermissions: ['ManageChannels'],
    dmPermission: false,
  })
  public async unalias(
    @Context() [interaction]: SlashCommandContext,
    @Options() { activity }: UnaliasDto,
  ) {
    const deletedAlias = await this.aliasService.deleteAlias(
      interaction.guildId,
      activity,
    );
    return interaction.reply({
      content: `Alias \`${deletedAlias.activity}\` has been deleted`,
    });
  }

  @SlashCommand({
    name: 'aliases',
    description: 'List all aliases',
    defaultMemberPermissions: ['ManageChannels'],
    dmPermission: false,
  })
  public async aliases(@Context() [interaction]: SlashCommandContext) {
    const aliases = await this.aliasService.listAliases(interaction.guildId);
    const aliasList = aliases
      .map(({ activity, alias }) => `\`${activity}\` -> \`${alias}\``)
      .join('\n');
    return interaction.reply({
      content: `Aliases:\n${aliasList}`,
    });
  }
}
