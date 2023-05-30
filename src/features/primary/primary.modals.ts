import { Injectable } from '@nestjs/common';
import { EmbedBuilder } from 'discord.js';
import { Ctx, Modal, type ModalContext, ModalParam } from 'necord';

import { KyselyService } from '../kysely';

import { PrimaryService } from './primary.service';

@Injectable()
export class PrimaryModals {
  constructor(
    private readonly kysely: KyselyService,
    private readonly primaryService: PrimaryService,
  ) {}

  @Modal('primary/:id')
  public async onPrimaryModal(
    @Ctx() [interaction]: ModalContext,
    @ModalParam('id') id: string,
  ) {
    const primary = await this.kysely
      .selectFrom('Primary')
      .where('id', '=', id)
      .selectAll()
      .executeTakeFirst();

    if (!primary) {
      throw new Error('Primary not found');
    }

    const newGeneralTemplate = interaction.fields.getTextInputValue('general');
    const newGameTemplate = interaction.fields.getTextInputValue('template');

    const updatedPrimary = await this.kysely
      .updateTable('Primary')
      .set({
        generalName: newGeneralTemplate,
        template: newGameTemplate,
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    const embed = new EmbedBuilder()
      .setTitle('Primary Updated')
      .setColor('Green')
      .setDescription('Primary updated successfully!')
      .addFields(
        { name: 'General Template', value: updatedPrimary.template },
        { name: 'Game Template', value: updatedPrimary.generalName },
      );

    await this.primaryService.updateSecondaries(interaction.guildId, id);

    return interaction.reply({
      ephemeral: true,
      embeds: [embed],
    });
  }
}
