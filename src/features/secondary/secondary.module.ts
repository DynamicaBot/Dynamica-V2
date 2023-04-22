import { Module } from '@nestjs/common';

import { SecondaryCommands } from './secondary.commands';
import { SecondaryEvents } from './secondary.events';
import { SecondaryModals } from './secondary.modals';
import { SecondaryService } from './secondary.service';

@Module({
  imports: [],
  providers: [
    SecondaryService,
    SecondaryCommands,
    SecondaryEvents,
    SecondaryModals,
  ],
  exports: [SecondaryService],
})
export class SecondaryModule {}
