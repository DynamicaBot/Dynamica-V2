import { Injectable } from '@nestjs/common';
import {
  ActionRowBuilder,
  UserSelectMenuBuilder,
  channelMention,
} from 'discord.js';
import { Button, type ButtonContext, ComponentParam, Context } from 'necord';

import { SecondaryService } from './secondary.service';

@Injectable()
export class SecondaryButtons {
  constructor(private readonly secondaryService: SecondaryService) {}

  @Button('secondary/buttons/unlock/:id')
  public async onUnlock(
    @Context() [interaction]: ButtonContext,
    @ComponentParam('id') id: string,
  ) {
    try {
      await this.secondaryService.unlock(
        interaction.guildId,
        id,
        interaction.user.id,
      );

      const messageComponents =
        await this.secondaryService.createSecondarySettingsComponents(
          interaction.guildId,
          id,
        );

      return interaction.update({
        components: [messageComponents],
      });
    } catch (error) {
      return interaction.reply({
        ephemeral: true,
        content: `An Error occured: ${error.message}`,
      });
    }
  }

  @Button('secondary/buttons/lock/:id')
  public async onLock(
    @Context() [interaction]: ButtonContext,
    @ComponentParam('id') id: string,
  ) {
    try {
      await this.secondaryService.lock(
        interaction.guildId,
        id,
        interaction.user.id,
      );
      const messageComponents =
        await this.secondaryService.createSecondarySettingsComponents(
          interaction.guildId,
          id,
        );
      return interaction.update({
        components: [messageComponents],
      });
    } catch (error) {
      return interaction.reply({
        ephemeral: true,
        content: `An Error occured: ${error.message}`,
      });
    }
  }

  @Button('secondary/buttons/transfer/:id')
  public async onTransfer(
    @Context() [interaction]: ButtonContext,
    @ComponentParam('id') id: string,
  ) {
    try {
      const selectComponent =
        await this.secondaryService.createSecondaryTransferSelect(
          interaction.guildId,
          id,
          interaction.user.id,
        );

      const row = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
        selectComponent,
      );

      return interaction.reply({
        ephemeral: true,
        content: `Select a user to transfer ownership to`,
        components: [row],
      });
    } catch (error) {
      return interaction.reply({
        content: `An Error occured: ${error.message}`,
        ephemeral: true,
      });
    }
  }

  @Button('secondary/buttons/settings/:id')
  public async onSettings(
    @Context() [interaction]: ButtonContext,
    @ComponentParam('id') id: string,
  ) {
    try {
      const messageComponents =
        await this.secondaryService.createSecondarySettingsComponents(
          interaction.guildId,
          id,
        );

      const modal = await this.secondaryService.createSecondaryModal(
        interaction.guildId,
        id,
      );

      await interaction.showModal(modal);

      return interaction.update({
        components: [messageComponents],
      });
    } catch (error) {
      return interaction.reply({
        ephemeral: true,
        content: `An Error occured: ${error.message}`,
      });
    }
  }
}
