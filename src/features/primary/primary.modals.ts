import { Injectable } from '@nestjs/common';
import { EmbedBuilder } from 'discord.js';
import { Ctx, Modal, type ModalContext, ModalParam } from 'necord';

import { PrismaService } from '../prisma';

import { PrimaryService } from './primary.service';

@Injectable()
export class PrimaryModals {
  constructor(
    private readonly db: PrismaService,
    private readonly primaryService: PrimaryService,
  ) {}

  @Modal('primary/:id')
  public async onPrimaryModal(
    @Ctx() [interaction]: ModalContext,
    @ModalParam('id') id: string,
  ) {
    const primary = this.db.primary.findUnique({
      where: {
        guildId_id: {
          guildId: interaction.guild.id,
          id,
        },
      },
    });

    if (!primary) {
      throw new Error('Primary not found');
    }

    const newGeneralTemplate = interaction.fields.getTextInputValue('general');
    const newGameTemplate = interaction.fields.getTextInputValue('template');

    const updatedPrimary = await this.db.primary.update({
      where: {
        guildId_id: {
          guildId: interaction.guild.id,
          id,
        },
      },
      data: {
        generalName: newGeneralTemplate,
        template: newGameTemplate,
      },
    });

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
