import { Module } from '@nestjs/common';

import { SecondaryService, SecondaryModule } from '@/features/secondary';

import { SecondaryModals } from '../secondary/secondary.modals';

import { PrimaryCommands } from './primary.commands';
import { PrimaryEvents } from './primary.events';
import { PrimaryModals } from './primary.modals';
import { PrimaryService } from './primary.service';

@Module({
  imports: [SecondaryModule],
  providers: [
    PrimaryService,
    PrimaryCommands,
    PrimaryEvents,
    SecondaryService,
    PrimaryModals,
  ],
  exports: [PrimaryService],
})
export class PrimaryModule {}
