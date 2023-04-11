import { Module } from '@nestjs/common';
import { AliasService } from './alias.service';
import { AliasCommands } from './alias.commands';
import { SecondaryModule } from '../secondary/secondary.module';
import { SecondaryService } from '../secondary/secondary.service';

@Module({
  imports: [SecondaryModule],
  providers: [AliasService, AliasCommands, SecondaryService],
})
export class AliasModule {}
