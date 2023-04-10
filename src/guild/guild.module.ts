import { Module } from '@nestjs/common';
import { GuildEvents} from './guild.events'

@Module({
    providers: [GuildEvents]
})
export class GuildModule {}
