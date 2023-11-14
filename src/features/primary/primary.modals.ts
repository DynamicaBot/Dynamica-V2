import { Inject, Injectable } from '@nestjs/common';
import { EmbedBuilder } from 'discord.js';
import { and, eq } from 'drizzle-orm';
import { Ctx, Modal, type ModalContext, ModalParam } from 'necord';

import { primary } from '@/db/schema';

import { DRIZZLE_TOKEN, type Drizzle } from '../drizzle/drizzle.module';

import { PrimaryService } from './primary.service';

@Injectable()
export class PrimaryModals {
  constructor(
    @Inject(DRIZZLE_TOKEN) private readonly db: Drizzle,
    private readonly primaryService: PrimaryService,
  ) {}

  @Modal('primary/:id')
  public async onPrimaryModal(
    @Ctx() [interaction]: ModalContext,
    @ModalParam('id') id: string,
  ) {
    const guildId = interaction.guildId;

    if (!guildId) {
      return interaction.reply({
        ephemeral: true,
        content: 'This command can only be used in a server.',
      });
    }

    // const primary = this.db.primary.findUnique({
    //   where: {
    //     guildId_id: {
    //       guildId: interaction.guildId,
    //       id,
    //     },
    //   },
    // });
    const [dbPrimary] = await this.db
      .select({ id: primary.id })
      .from(primary)
      .where(and(eq(primary.guildId, guildId), eq(primary.id, id)));

    if (!dbPrimary) {
      throw new Error('Primary not found');
    }

    const newGeneralTemplate = interaction.fields.getTextInputValue('general');
    const newGameTemplate = interaction.fields.getTextInputValue('template');

    // const updatedPrimary = await this.db.primary.update({
    //   where: {
    //     guildId_id: {
    //       guildId: interaction.guild.id,
    //       id,
    //     },
    //   },
    //   data: {
    //     generalName: newGeneralTemplate,
    //     template: newGameTemplate,
    //   },
    // });

    const [updatedPrimary] = await this.db
      .update(primary)
      .set({
        generalName: newGeneralTemplate,
        template: newGameTemplate,
      })
      .where(and(eq(primary.guildId, guildId), eq(primary.id, id)));

    const embed = new EmbedBuilder()
      .setTitle('Primary Updated')
      .setColor('Green')
      .setDescription('Primary updated successfully!')
      .addFields(
        { name: 'General Template', value: updatedPrimary.template },
        { name: 'Game Template', value: updatedPrimary.generalName },
      );

    await this.primaryService.updateSecondaries(guildId, id);

    return interaction.reply({
      ephemeral: true,
      embeds: [embed],
    });
  }
}
