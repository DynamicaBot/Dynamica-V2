import { Module } from '@nestjs/common';

import { SecondaryModule } from '../secondary/secondary.module';
import { SecondaryService } from '../secondary/secondary.service';

import { AliasCommands } from './alias.commands';
import { AliasResolver } from './alias.resolver';
import { AliasService } from './alias.service';

@Module({
  imports: [SecondaryModule],
  providers: [AliasService, AliasCommands, SecondaryService, AliasResolver],
})
export class AliasModule {}
