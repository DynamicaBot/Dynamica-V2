import { Module } from '@nestjs/common';

import { SecondaryCommands } from './secondary.commands';
import { SecondaryEvents } from './secondary.events';
import { SecondaryService } from './secondary.service';

@Module({
  imports: [],
  providers: [SecondaryService, SecondaryCommands, SecondaryEvents],
  exports: [SecondaryService],
})
export class SecondaryModule {}
