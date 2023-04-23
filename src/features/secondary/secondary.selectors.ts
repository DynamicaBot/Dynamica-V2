import { Injectable } from '@nestjs/common';
import { userMention } from 'discord.js';
import {
  Context,
  type ISelectedMembers,
  type ISelectedUsers,
  SelectedMembers,
  SelectedUsers,
  UserSelect,
  type UserSelectContext,
} from 'necord';

import { SecondaryService } from './secondary.service';

@Injectable()
export class SecondarySelectors {
  constructor(private readonly secondaryService: SecondaryService) {}

  @UserSelect('secondary/selectors/transfer/:channelId')
  public async onTransfer(
    @Context() [interaction]: UserSelectContext,
    @SelectedUsers() users: ISelectedUsers,
    @SelectedMembers() members: ISelectedMembers,
  ) {
    try {
      const selectedMember = members.first();

      await this.secondaryService.transfer(
        interaction.guildId,
        interaction.channelId,
        interaction.user.id,
        selectedMember.user.id,
      );

      return interaction.update({
        content: `Channel Transferred to ${userMention(
          selectedMember.user.id,
        )}`,
        components: [],
      });
    } catch (error) {
      return interaction.reply({
        ephemeral: true,
        content: `An Error occured: ${error.message}`,
      });
    }
  }
}
