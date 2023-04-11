import { Module } from '@nestjs/common';
import { PrimaryService } from './primary.service';
import { PrimaryCommands } from './primary.commands';
import { PrimaryEvents } from './primary.events';
import { SecondaryService } from '@/features/secondary';
import { SecondaryModule } from '@/features/secondary';

@Module({
  imports: [SecondaryModule],
  providers: [PrimaryService, PrimaryCommands, PrimaryEvents, SecondaryService],
  exports: [PrimaryService],
})
export class PrimaryModule {}
