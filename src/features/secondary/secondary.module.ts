import { Module } from '@nestjs/common';

import { SecondaryButtons } from './secondary.buttons';
import { SecondaryCommands } from './secondary.commands';
import { SecondaryEvents } from './secondary.events';
import { SecondaryModals } from './secondary.modals';
import { SecondaryResolver } from './secondary.resolver';
import { SecondarySelectors } from './secondary.selectors';
import { SecondaryService } from './secondary.service';

@Module({
  imports: [],
  providers: [
    SecondaryService,
    SecondaryCommands,
    SecondaryEvents,
    SecondaryModals,
    SecondaryButtons,
    SecondarySelectors,
    SecondaryResolver,
  ],
  exports: [SecondaryService],
})
export class SecondaryModule {}
