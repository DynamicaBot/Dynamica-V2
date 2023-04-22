import { Injectable } from '@nestjs/common';
import { Ctx, Modal, type ModalContext, ModalParam } from 'necord';

import { PrismaService } from '../prisma';

import { SecondaryService } from './secondary.service';

@Injectable()
export class SecondaryModals {
  constructor(
    private readonly db: PrismaService,
    private readonly secondaryService: SecondaryService,
  ) {}

  @Modal('secondary/:id')
  public onSecondaryModal(
    @Ctx() [interaction]: ModalContext,
    @ModalParam('id') id: string,
  ) {
    return interaction.reply({
      content: 'Not Implemented',
      ephemeral: true,
    });
  }
}
