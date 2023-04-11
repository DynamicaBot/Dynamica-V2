import { Module } from '@nestjs/common';
import { SecondaryService } from './secondary.service';
import { SecondaryCommands } from './secondary.commands';
import { SecondaryEvents } from './secondary.events';

@Module({
  imports: [],
  providers: [SecondaryService, SecondaryCommands, SecondaryEvents],
  exports: [SecondaryService],
})
export class SecondaryModule {}
