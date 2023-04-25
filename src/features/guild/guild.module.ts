import { Module } from '@nestjs/common';

import { GuildEvents } from './guild.events';
import { GuildResolver } from './guild.resolver';
import { GuildService } from './guild.service';

@Module({
  providers: [GuildEvents, GuildService, GuildResolver],
  exports: [GuildService],
})
export class GuildModule {}
