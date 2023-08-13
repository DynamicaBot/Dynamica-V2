import { Module } from '@nestjs/common';

import { GuildEvents } from './guild.events';
import { GuildService } from './guild.service';

@Module({
  providers: [GuildEvents, GuildService],
  exports: [GuildService],
})
export class GuildModule {}
