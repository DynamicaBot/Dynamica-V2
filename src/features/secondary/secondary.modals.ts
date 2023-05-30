import { Injectable } from '@nestjs/common';
import { Ctx, Modal, type ModalContext, ModalParam } from 'necord';

import createErrorEmbed from '@/utils/createErrorEmbed';

import { SecondaryService } from './secondary.service';

@Injectable()
export class SecondaryModals {
  constructor(private readonly secondaryService: SecondaryService) {}

  @Modal('secondary/modals/:id')
  public async onSecondaryModal(
    @Ctx() [interaction]: ModalContext,
    @ModalParam('id') id: string,
  ) {
    try {
      const newName = interaction.fields.getTextInputValue('name');

      const updatedSecondary = await this.secondaryService.name(
        interaction.guildId,
        id,
        newName.length ? newName : null,
        interaction.user.id,
      );

      // const updatedComponents =
      //   await this.secondaryService.createSecondarySettingsComponents(
      //     interaction.guildId,
      //     id,
      //   );

      // await interaction({
      //   components: [updatedComponents],
      // });

      return interaction.reply({
        ephemeral: true,
        content: `Channel name updated to ${updatedSecondary.name}`,
      });
    } catch (error) {
      const errorEmbed = createErrorEmbed(error.message);

      return interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true,
      });
    }
  }
}
