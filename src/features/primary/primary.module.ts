import { Module } from '@nestjs/common';

import { SecondaryService, SecondaryModule } from '@/features/secondary';

import { PrimaryCommands } from './primary.commands';
import { PrimaryEvents } from './primary.events';
import { PrimaryService } from './primary.service';

@Module({
  imports: [SecondaryModule],
  providers: [PrimaryService, PrimaryCommands, PrimaryEvents, SecondaryService],
  exports: [PrimaryService],
})
export class PrimaryModule {}
